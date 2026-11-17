import { Router } from "express";
import { body } from "express-validator";
import bcrypt from "bcryptjs";
import { User } from "../models";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { validate } from "../middleware/validator";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  sendEmailVerificationCode,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../services/email";
import { sendPasswordResetSMS, sendSMS } from "../services/sms";
import {
  AccountType,
  ApprovalStatus,
  ORGANIZATION_CATEGORIES,
  isOrganizationType,
} from "../utils/accountTypes";

const router = Router();
const VERIFICATION_CODE_EXPIRY_MS = 15 * 60 * 1000;
const LOGIN_OTP_EXPIRY_MS = 10 * 60 * 1000;
const isDevelopment = process.env.NODE_ENV !== "production";

const generateSixDigitCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const isIndividual = (_value: unknown, { req }: { req: any }) =>
  !req.body.accountType || req.body.accountType === AccountType.INDIVIDUAL;

const isOrganizationRequest = (_value: unknown, { req }: { req: any }) =>
  isOrganizationType(req.body.accountType);

const uiError = (
  error: string,
  dismissAfterMs = 6000,
  severity: "warning" | "error" = "warning",
) => ({ error, dismissAfterMs, severity });

const buildAuthResponse = (user: any) => {
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    stateCode: user.stateCode || undefined,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    stateCode: user.stateCode || undefined,
  });

  return {
    message: "Login successful",
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationName: user.organizationName,
      role: user.role,
      accountType: user.accountType,
      approvalStatus: user.approvalStatus,
      stateCode: user.stateCode,
    },
    accessToken,
    refreshToken,
  };
};

// Register User
router.post(
  "/register",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("phone").matches(/^\+?[1-9]\d{1,14}$/),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName")
      .if(isIndividual)
      .notEmpty()
      .withMessage("First name is required")
      .trim(),
    body("lastName")
      .if(isIndividual)
      .notEmpty()
      .withMessage("Last name is required")
      .trim(),
    body("organizationName")
      .if((_v, { req }) => !isIndividual(_v, { req }))
      .notEmpty()
      .withMessage("Registered organisation name is required")
      .trim(),
    body("registrationNumber")
      .if(isOrganizationRequest)
      .trim()
      .notEmpty()
      .withMessage("CAC / registration number is required")
      .isLength({ min: 3, max: 30 })
      .withMessage("Enter a valid registration number"),
    body("contactPersonName")
      .if(isOrganizationRequest)
      .trim()
      .notEmpty()
      .withMessage("Contact person name is required"),
    body("contactPersonPhone")
      .if(isOrganizationRequest)
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage("Enter a valid contact person phone number"),
    body("organizationCategory")
      .if(isOrganizationRequest)
      .custom((value, { req }) =>
        (ORGANIZATION_CATEGORIES[req.body.accountType] || []).includes(value),
      )
      .withMessage("Select a valid organisation category"),
    body("numberOfBins")
      .if(isOrganizationRequest)
      .isInt({ min: 1, max: 1000 })
      .withMessage("Number of bins must be at least 1"),
    body("accountType")
      .optional()
      .isIn(Object.values(AccountType))
      .withMessage("Invalid account type"),
    body("stateCode").optional().isString(),
    body("lgaId").optional().isString(),
    body("address").optional().isString(),
  ]),
  async (req, res) => {
    try {
      const {
        email,
        phone,
        password,
        firstName,
        lastName,
        organizationName,
        registrationNumber,
        contactPersonName,
        contactPersonPhone,
        organizationCategory,
        numberOfBins,
        accountType,
        address,
        stateCode,
        lgaId,
      } = req.body;

      // Check if user exists
      const isOrganization = isOrganizationType(accountType);
      const normalizedRegNumber = isOrganization
        ? String(registrationNumber).trim().toUpperCase()
        : undefined;
      const existingUser = await User.findOne({
        $or: [
          { email },
          { phone },
          ...(normalizedRegNumber
            ? [{ registrationNumber: normalizedRegNumber }]
            : []),
        ],
      });

      if (existingUser) {
        const regTaken =
          normalizedRegNumber &&
          existingUser.registrationNumber === normalizedRegNumber;
        return res
          .status(400)
          .json(
            uiError(
              regTaken
                ? "This registration number is already registered"
                : "Email or phone already registered",
              7000,
            ),
          );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = generateSixDigitCode();
      const verificationCodeExpiry = new Date(
        Date.now() + VERIFICATION_CODE_EXPIRY_MS,
      );

      // Create user
      const user = await User.create({
        email,
        phone,
        password: hashedPassword,
        // Organisations keep their name in firstName so greetings and emails still read correctly
        firstName: isOrganization ? organizationName : firstName,
        lastName: isOrganization ? "" : lastName,
        organizationName: isOrganization ? organizationName : undefined,
        registrationNumber: normalizedRegNumber,
        contactPersonName: isOrganization ? contactPersonName : undefined,
        contactPersonPhone: isOrganization
          ? String(contactPersonPhone).replace(/\s/g, "")
          : undefined,
        organizationCategory: isOrganization ? organizationCategory : undefined,
        numberOfBins: isOrganization ? Number(numberOfBins) : undefined,
        // Organisations are billed only after a state admin approves them
        approvalStatus: isOrganization
          ? ApprovalStatus.PENDING
          : ApprovalStatus.APPROVED,
        address,
        // FIX: store stateCode on user so address submissions work
        stateCode: stateCode || undefined,
        lgaId,
        role: "USER",
        accountType: accountType || AccountType.INDIVIDUAL,
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpiry: verificationCodeExpiry,
      });

      const verificationEmailSent = await sendEmailVerificationCode(
        user.email,
        verificationCode,
        user.firstName || "User",
      );

      if (!verificationEmailSent) {
        console.error("Failed to send verification email during registration");
      }

      // FIX: include stateCode in token payload so backend can read it
      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        stateCode: user.stateCode || undefined,
      });

      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        stateCode: user.stateCode || undefined,
      });

      res.status(201).json({
        message: verificationEmailSent
          ? "Registration successful. Verification code sent to your email"
          : "Registration successful, but we could not send verification email right now. Please use resend verification.",
        requiresEmailVerification: true,
        verificationDelivery: verificationEmailSent ? "sent" : "failed",
        ...(isDevelopment && !verificationEmailSent
          ? { verificationCodeForTesting: verificationCode }
          : {}),
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationName: user.organizationName,
          address: user.address,
          role: user.role,
          accountType: user.accountType,
          approvalStatus: user.approvalStatus,
          stateCode: user.stateCode,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  },
);

// Verify email with code
router.post(
  "/verify-email",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("verificationCode")
      .isLength({ min: 6, max: 6 })
      .withMessage("Verification code must be 6 digits"),
  ]),
  async (req, res) => {
    try {
      const { email, verificationCode } = req.body;

      const user = await User.findOne({ email });

      if (
        !user ||
        !user.emailVerificationCode ||
        !user.emailVerificationCodeExpiry
      ) {
        return res
          .status(400)
          .json({ error: "Invalid or expired verification code" });
      }

      if (user.emailVerified) {
        return res.json({ message: "Email already verified" });
      }

      if (new Date() > user.emailVerificationCodeExpiry) {
        return res
          .status(400)
          .json(uiError("Verification code has expired", 7000));
      }

      if (user.emailVerificationCode !== verificationCode) {
        return res.status(400).json(uiError("Invalid verification code", 7000));
      }

      user.emailVerified = true;
      user.isVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationCodeExpiry = undefined;
      await user.save();

      void sendWelcomeEmail(user.email, user.firstName || "User").catch(
        (err) => {
          console.error("Failed to send welcome email:", err);
        },
      );

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  },
);

// Resend verification code
router.post(
  "/resend-verification",
  validate([body("email").isEmail().normalizeEmail()]),
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.json({
          message: "If the email exists, a verification code has been sent",
        });
      }

      if (user.emailVerified) {
        return res.json({ message: "Email already verified" });
      }

      const verificationCode = generateSixDigitCode();
      user.emailVerificationCode = verificationCode;
      user.emailVerificationCodeExpiry = new Date(
        Date.now() + VERIFICATION_CODE_EXPIRY_MS,
      );
      await user.save();

      const verificationEmailSent = await sendEmailVerificationCode(
        user.email,
        verificationCode,
        user.firstName || "User",
      );

      if (!verificationEmailSent) {
        console.error("Failed to resend verification email");

        if (isDevelopment) {
          return res.json({
            message:
              "Unable to send email in development. Use the test verification code.",
            verificationDelivery: "failed",
            verificationCodeForTesting: verificationCode,
          });
        }

        return res.status(503).json({
          error:
            "Unable to send verification email right now. Please try again later.",
        });
      }

      res.json({
        message: "Verification code sent",
        verificationDelivery: "sent",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Failed to resend verification code" });
    }
  },
);

// Login User
router.post(
  "/login",
  validate([
    body("email").optional().isEmail().normalizeEmail(),
    body("phone")
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/),
    body("password").notEmpty(),
  ]),
  async (req, res) => {
    try {
      const { email, phone, password } = req.body;

      if (!email && !phone) {
        return res.status(400).json(uiError("Email or phone is required"));
      }

      // Find user
      const user = await User.findOne(email ? { email } : { phone });

      if (!user) {
        return res.status(401).json(uiError("Invalid credentials", 6000));
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json(uiError("Invalid credentials", 6000));
      }

      if (!user.isActive) {
        return res.status(403).json(uiError("Account is disabled", 7000));
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          error: "Please verify your email before logging in",
          requiresEmailVerification: true,
          email: user.email,
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json(buildAuthResponse(user));
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  },
);

// Send login OTP
router.post(
  "/login-otp/send",
  validate([body("phone").matches(/^\+?[1-9]\d{1,14}$/)]),
  async (req, res) => {
    try {
      const { phone } = req.body;
      const user = await User.findOne({ phone });

      if (!user || !user.isActive) {
        return res
          .status(404)
          .json({ error: "No active account found for this phone number" });
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          error: "Please verify your email before logging in",
          requiresEmailVerification: true,
          email: user.email,
        });
      }

      const otpCode = generateSixDigitCode();
      user.loginOtpCode = otpCode;
      user.loginOtpExpiry = new Date(Date.now() + LOGIN_OTP_EXPIRY_MS);
      await user.save();

      const smsSent = await sendSMS({
        to: user.phone,
        message: `Your Bin-Pay login code is ${otpCode}. It expires in 10 minutes.`,
      });

      if (!smsSent) {
        return res
          .status(500)
          .json(
            uiError("Unable to send OTP right now. Please try again.", 7000),
          );
      }

      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Send login OTP error:", error);
      res.status(500).json({ error: "Failed to send login OTP" });
    }
  },
);

// Verify login OTP
router.post(
  "/login-otp/verify",
  validate([
    body("phone").matches(/^\+?[1-9]\d{1,14}$/),
    body("otpCode").isLength({ min: 6, max: 6 }),
  ]),
  async (req, res) => {
    try {
      const { phone, otpCode } = req.body;
      const user = await User.findOne({ phone });

      if (
        !user ||
        !user.isActive ||
        !user.loginOtpCode ||
        !user.loginOtpExpiry
      ) {
        return res.status(400).json(uiError("Invalid or expired OTP", 7000));
      }

      if (new Date() > user.loginOtpExpiry) {
        user.loginOtpCode = undefined;
        user.loginOtpExpiry = undefined;
        await user.save();
        return res
          .status(400)
          .json(uiError("OTP has expired. Request a new code.", 7000));
      }

      if (user.loginOtpCode !== otpCode) {
        return res.status(400).json(uiError("Invalid OTP code", 7000));
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          error: "Please verify your email before logging in",
          requiresEmailVerification: true,
          email: user.email,
        });
      }

      user.loginOtpCode = undefined;
      user.loginOtpExpiry = undefined;
      user.lastLogin = new Date();
      await user.save();

      res.json(buildAuthResponse(user));
    } catch (error) {
      console.error("Verify login OTP error:", error);
      res.status(500).json({ error: "Failed to verify login OTP" });
    }
  },
);

// Refresh Token
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      stateCode: user.stateCode || undefined,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Get Current User
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Forgot Password - Send Reset Code
router.post(
  "/forgot-password",
  validate([body("email").isEmail().normalizeEmail()]),
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.json({
          message: "If the email exists, a reset code has been sent",
        });
      }

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

      user.resetCode = resetCode;
      user.resetCodeExpiry = resetCodeExpiry;
      await user.save();

      const emailSent = await sendPasswordResetEmail(
        email,
        resetCode,
        user.firstName || "User",
      );

      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`);
      } else {
        console.log(`✅ Password reset email sent to ${email}`);
      }

      if (user.phone) {
        const smsSent = await sendPasswordResetSMS(
          user.phone,
          resetCode,
          user.firstName || "User",
        );
        if (smsSent) {
          console.log(`✅ Password reset SMS sent to ${user.phone}`);
        }
      }

      res.json({ message: "If the email exists, a reset code has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  },
);

// Reset Password with Code
router.post(
  "/reset-password",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("resetCode").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ]),
  async (req, res) => {
    try {
      const { email, resetCode, newPassword } = req.body;

      const user = await User.findOne({ email });

      if (!user || !user.resetCode || !user.resetCodeExpiry) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      if (user.resetCode !== resetCode) {
        return res.status(400).json({ error: "Invalid reset code" });
      }

      if (new Date() > user.resetCodeExpiry) {
        return res.status(400).json({ error: "Reset code has expired" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetCode = undefined;
      user.resetCodeExpiry = undefined;
      await user.save();

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  },
);

// Change Password
router.post(
  "/change-password",
  authenticate,
  validate([
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  },
);

export default router;
