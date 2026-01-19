import { Router } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { validate } from '../middleware/validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/email';
import { sendPasswordResetSMS } from '../services/sms';

const router = Router();

// Register User
router.post(
  '/register',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('phone').matches(/^\+?[1-9]\d{1,14}$/),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('stateCode').optional().isString(),
    body('lgaId').optional().isString(),
    body('address').optional().isString(),
  ]),
  async (req, res) => {
    try {
      const { email, phone, password, firstName, lastName } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email or phone already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER',
      });

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login User
router.post(
  '/login',
  validate([
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().matches(/^\+?[1-9]\d{1,14}$/),
    body('password').notEmpty(),
  ]),
  async (req, res) => {
    try {
      const { email, phone, password } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ error: 'Email or phone is required' });
      }

      // Find user
      const user = await User.findOne(email ? { email } : { phone });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is disabled' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
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

      res.json({
        message: 'Login successful',
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
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Refresh Token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      stateCode: user.stateCode || undefined,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get Current User
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Forgot Password - Send Reset Code
router.post(
  '/forgot-password',
  validate([body('email').isEmail().normalizeEmail()]),
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: 'If the email exists, a reset code has been sent' });
      }

      // Generate 6-digit reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset code
      user.resetCode = resetCode;
      user.resetCodeExpiry = resetCodeExpiry;
      await user.save();

      // Send reset code via email
      const emailSent = await sendPasswordResetEmail(
        email,
        resetCode,
        user.firstName || 'User'
      );

      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`);
        // Continue anyway for security (don't reveal if email failed)
      } else {
        console.log(`✅ Password reset email sent to ${email}`);
      }

      // Send reset code via SMS if phone is available
      if (user.phone) {
        const smsSent = await sendPasswordResetSMS(
          user.phone,
          resetCode,
          user.firstName || 'User'
        );

        if (smsSent) {
          console.log(`✅ Password reset SMS sent to ${user.phone}`);
        }
      }

      res.json({ message: 'If the email exists, a reset code has been sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// Reset Password with Code
router.post(
  '/reset-password',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('resetCode').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ]),
  async (req, res) => {
    try {
      const { email, resetCode, newPassword } = req.body;

      const user = await User.findOne({ email });

      if (!user || !user.resetCode || !user.resetCodeExpiry) {
        return res.status(400).json({ error: 'Invalid or expired reset code' });
      }

      if (user.resetCode !== resetCode) {
        return res.status(400).json({ error: 'Invalid reset code' });
      }

      if (new Date() > user.resetCodeExpiry) {
        return res.status(400).json({ error: 'Reset code has expired' });
      }

      // Reset password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetCode = undefined;
      user.resetCodeExpiry = undefined;
      await user.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// Change Password
router.post(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

export default router;
