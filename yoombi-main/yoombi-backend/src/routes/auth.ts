import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';
import { sendResetPasswordEmail, sendVerificationEmail } from '../utils/mail';
import crypto from 'crypto';
import { JWT_SECRET } from '../config/env';

const router = Router();
const prisma = new PrismaClient();

const isStrongPassword = (password: string): boolean => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
};

// Helper to format user for response
const formatUser = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  isApproved: user.isApproved,
  isEmailVerified: user.isEmailVerified,
  isBlocked: user.isBlocked,
  restaurantId: user.ownedRestaurant?.id,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

// Register User
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  console.log(`[AUTH] Registration attempt for email: ${req.body.email} at ${new Date().toISOString()}`);
  try {
    const { 
      email, 
      password, 
      name, 
      role, 
      phone,
      restaurantName,
      restaurantDescription,
      restaurantCuisine,
      vibe,
      dressCode,
      city,
      area,
      latitude,
      longitude,
      restaurantImage,
      restaurantEmail,
      restaurantPhone,
      appVersion,
      platform
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: role || 'USER',
          isApproved: (role === 'ADMIN' || role === 'USER'),
          ...(appVersion && { appVersion }),
          ...(platform && { platform }),
        } as any,
        include: { ownedRestaurant: true } as any
      });

      if (role === 'OWNER' && restaurantName) {
        await tx.restaurant.create({
          data: {
            name: restaurantName,
            city: city || 'Kigali',
            area: area || '',
            latitude: latitude || 0.0,
            longitude: longitude || 0.0,
            ownerId: newUser.id,
            description: restaurantDescription || `Welcome to ${restaurantName}`,
            cuisine: restaurantCuisine || 'Modern African',
            vibe: vibe || 'Elegant',
            dressCode: dressCode || 'Smart Casual',
            images: restaurantImage ? [restaurantImage] : [],
            phone: restaurantPhone,
            email: restaurantEmail
          }
        });
      }

      // Re-fetch to get included relations
      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { ownedRestaurant: true } as any
      });
    });

    if (!user) {
      throw new Error('User creation failed');
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    res.status(201).json({
      success: true,
      data: {
        user: formatUser(user),
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Login User
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  console.log('[AUTH] Login attempt at:', new Date().toISOString(), 'for:', req.body.email);
  try {
    const { email, password, appVersion, platform } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { ownedRestaurant: true } as any
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update app version/platform on login
    if (appVersion || platform) {
        await prisma.user.update({
            where: { id: user.id },
            data: { ...(appVersion && { appVersion }), ...(platform && { platform }) } as any
        });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked' });
    }

    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    res.json({
      success: true,
      data: {
        user: formatUser(user),
        accessToken,
        refreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        ownedRestaurant: true,
        following: true,
        likes: true
      } as any
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        ...formatUser(user),
        loyaltyPoints: (user as any).loyaltyPoints,
        following: (user as any).following.map((f: any) => f.restaurantId),
        likedRestaurants: (user as any).likes.map((l: any) => l.restaurantId)
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get Current User Favorites (Following)
router.get('/me/favorites', authenticateToken, async (req: any, res: Response) => {
  try {
    const favorites = await prisma.follow.findMany({
      where: { userId: req.user.id },
      include: {
        restaurant: {
          include: {
            _count: {
              select: { followers: true, reviews: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = favorites.map((f: any) => ({
      ...f.restaurant,
      totalReviews: f.restaurant._count.reviews,
      followers: f.restaurant._count.followers
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get Current User Reviews
router.get('/me/reviews', authenticateToken, async (req: any, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      include: {
        restaurant: {
          select: { id: true, name: true, images: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = reviews.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.text,
      createdAt: r.createdAt.toISOString(),
      restaurantName: r.restaurant.name,
      restaurantImage: r.restaurant.images.length > 0 ? r.restaurant.images[0] : 'https://via.placeholder.com/150',
      replies: r.ownerReply ? 1 : 0,
      ownerReply: r.ownerReply,
      repliedAt: r.repliedAt?.toISOString()
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update Current User Profile
router.patch('/me', authenticateToken, async (req: any, res: Response) => {
  try {
    const { name, phone, avatar } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatar && { avatar }),
      },
      include: { ownedRestaurant: true } as any
    });

    res.json({
      success: true,
      data: formatUser(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Change Password
router.post('/me/change-password', authenticateToken, async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete Account
router.delete('/me', authenticateToken, async (req: any, res: Response) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id }
    });
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    // 1. Verify token exists in DB
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      if (dbToken) await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    if (dbToken.user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked' });
    }

    // 2. Verify JWT signature
    try {
      jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // 3. Issue new tokens
    const accessToken = jwt.sign({ id: dbToken.user.id, role: dbToken.user.role }, JWT_SECRET, { expiresIn: '7d' });
    const newRefreshToken = jwt.sign({ id: dbToken.user.id }, JWT_SECRET, { expiresIn: '30d' });

    // 4. Update DB (Rotate token)
    await prisma.refreshToken.delete({ where: { id: dbToken.id } });
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: dbToken.user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60
      }
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Forgot Password (send OTP)
router.post('/forgot-password', otpLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success to avoid email enumeration
    if (user) {
      // 1. Generate unique token and 6-digit OTP
      const token = crypto.randomBytes(32).toString('hex');
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // 2. Clear old resets and store new one
      await prisma.passwordReset.deleteMany({ where: { email } });
      await prisma.passwordReset.create({
        data: { email, token, otp, expiresAt }
      });

      // 3. Send the email via SendGrid
      await sendResetPasswordEmail(email, token, otp);
    }

    res.json({ success: true, message: 'If an account exists with that email, a reset link and code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Reset Password (consume OTP)
router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { token, otp, newPassword } = req.body;
    if (!newPassword || !isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, message: 'Strong password is required' });
    }

    // 1. Find the reset record by token OR otp
    const reset = await prisma.passwordReset.findFirst({
        where: {
            OR: [
                { token: String(token) },
                { otp: String(otp) }
            ],
            expiresAt: { gt: new Date() }
        }
    });

    if (!reset) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset request.' });
    }

    // 2. Update the user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: reset.email },
      data: { password: hashedPassword }
    });

    // 3. Cleanup: delete the reset record
    await prisma.passwordReset.delete({ where: { id: reset.id } });
    
    res.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Send Verification Code (for signup)
router.post('/send-verify-code', otpLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Clear old codes and store new one
    await prisma.emailVerification.deleteMany({ where: { email } });
    await prisma.emailVerification.create({
      data: { email, otp, expiresAt }
    });

    await sendVerificationEmail(email, otp);

    res.json({ 
      success: true, 
      message: 'Verification code sent',
    });
  } catch (error) {
    console.error('Send verify code error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
});

// Verify Email Code
router.post('/verify-email', authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;
      
      const verification = await prisma.emailVerification.findFirst({
        where: { 
            email, 
            otp: String(code),
            expiresAt: { gt: new Date() }
        }
      });

      if (!verification) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      }

      // Mark user as verified if they exist
      await prisma.user.updateMany({
        where: { email },
        data: { isEmailVerified: true }
      });

      // Cleanup code
      await prisma.emailVerification.delete({ where: { id: verification.id } });

      return res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
