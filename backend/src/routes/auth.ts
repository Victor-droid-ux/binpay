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

const router = Router();
const VERIFICATION_CODE_EXPIRY_MS = 15 * 60 * 1000;
const LOGIN_OTP_EXPIRY_MS = 10 * 60 * 1000;
const isDevelopment = process.env.NODE_ENV !== "production";

const generateSixDigitCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

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
      role: user.role,
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
    body("firstName").notEmpty().trim(),
    body("lastName").notEmpty().trim(),
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
        address,
        stateCode,
        lgaId,
      } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Email or phone already registered" });
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
        firstName,
        lastName,
        address,
        // FIX: store stateCode on user so address submissions work
        stateCode: stateCode || undefined,
        lgaId,
        role: "USER",
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
          address: user.address,
          role: user.role,
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
        return res.status(400).json({ error: "Verification code has expired" });
      }

      if (user.emailVerificationCode !== verificationCode) {
        return res.status(400).json({ error: "Invalid verification code" });
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
        return res.status(400).json({ error: "Email or phone is required" });
      }

      // Find user
      const user = await User.findOne(email ? { email } : { phone });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is disabled" });
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
          .json({ error: "Unable to send OTP right now. Please try again." });
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
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      if (new Date() > user.loginOtpExpiry) {
        user.loginOtpCode = undefined;
        user.loginOtpExpiry = undefined;
        await user.save();
        return res
          .status(400)
          .json({ error: "OTP has expired. Request a new code." });
      }

      if (user.loginOtpCode !== otpCode) {
        return res.status(400).json({ error: "Invalid OTP code" });
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
