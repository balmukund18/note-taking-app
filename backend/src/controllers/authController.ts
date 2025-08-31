import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { jwtService } from '../utils/jwt';
import { emailService } from '../utils/email';
import { googleAuthService, GoogleUserInfo } from '../utils/googleAuth';
import { logger } from '../utils/logger';
import {
  AppError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
  catchAsync,
} from '../middleware/errorHandler';

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: Partial<IUser>;
    accessToken?: string;
    refreshToken?: string;
  };
}

/**
 * Helper function to set httpOnly cookies for authentication
 */
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  // Set httpOnly cookies for secure token storage
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' required for cross-origin in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' required for cross-origin in production
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  
  // Debug logging for production
  if (isProduction) {
    console.log('Setting cookies with options:', {
      isProduction,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      httpOnly: cookieOptions.httpOnly
    });
  }
  
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

/**
 * POST /api/auth/signup
 * Email + name + dateOfBirth signup with OTP verification (no password)
 */
export const signup = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, name, dateOfBirth } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    if (existingUser.isEmailVerified) {
      throw new ConflictError('Account already exists and is verified. Please use Sign In instead.', 'USER_ALREADY_VERIFIED');
    } else {
      throw new ConflictError('Account exists but not verified. Please check your email for OTP or use resend OTP.', 'USER_EXISTS_UNVERIFIED');
    }
  }

  // Create new user (no password)
  const user = new User({
    email: email.toLowerCase(),
    name: name.trim(),
    dateOfBirth: new Date(dateOfBirth),
    isEmailVerified: false,
    authProvider: 'email',
  });

  // Generate and send OTP
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  const emailSent = await emailService.sendOTPEmail(user.email, otp, user.name);
  if (!emailSent) {
    // If email fails, clean up the user
    await User.findByIdAndDelete(user._id);
    throw new AppError('Failed to send verification email', 500, 'EMAIL_SEND_FAILED');
  }

  logger.info(`OTP sent to ${email} for user signup`);

  res.status(201).json({
    success: true,
    message: 'User created successfully. Please verify your email with the OTP sent.',
    data: {
      user: {
        _id: (user as any)._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
});

/**
 * POST /api/auth/google-signup
 * Google account signup
 */
export const googleSignup = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  try {
    // Verify Google ID token
    const googleUser: GoogleUserInfo = await googleAuthService.verifyIdToken(idToken);

    // Check if user already exists with this email
    const existingUser = await User.findOne({ 
      email: googleUser.email.toLowerCase() 
    });

    if (existingUser) {
      // If user exists, check their auth provider
      if (existingUser.authProvider === 'email') {
        throw new ConflictError(
          'An account with this email already exists. Please sign in using Email + OTP method.',
          'USER_EXISTS_WITH_EMAIL_AUTH'
        );
      } else if (existingUser.authProvider === 'google') {
        throw new ConflictError(
          'You already have an account with Google. Please use Sign In instead.',
          'USER_ALREADY_EXISTS_GOOGLE'
        );
      }
    }

    // Check if Google ID already exists
    const existingGoogleUser = await User.findOne({ googleId: googleUser.id });
    if (existingGoogleUser) {
      throw new ConflictError(
        'This Google account is already registered. Please use Sign In instead.',
        'GOOGLE_ID_ALREADY_EXISTS'
      );
    }

    // Create new user with Google auth
    const user = new User({
      email: googleUser.email.toLowerCase(),
      name: googleUser.name,
      profilePicture: googleUser.picture,
      isEmailVerified: googleUser.verified_email,
      authProvider: 'google',
      googleId: googleUser.id,
      lastLoginAt: new Date(),
    });

    await user.save();

    // Generate JWT tokens
    const { accessToken, refreshToken } = jwtService.generateTokenPair(user);

    // Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Send welcome email if email is verified
    if (user.isEmailVerified) {
      await emailService.sendWelcomeEmail(user.email, user.name);
    }

    logger.info(`Google signup successful for ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Google signup successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid Google token') {
      throw new AuthenticationError('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
    }
    throw error;
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and complete email verification
 */
export const verifyOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Check if email is already verified
  if (user.isEmailVerified) {
    throw new ValidationError('Email already verified', 'EMAIL_ALREADY_VERIFIED');
  }

  // Increment OTP attempts
  user.incrementOTPAttempts();

  // Check if OTP is expired
  if (user.isOTPExpired()) {
    await user.save();
    throw new ValidationError('OTP expired', 'OTP_EXPIRED');
  }

  // Check if OTP is already used
  if (user.isOTPUsed()) {
    await user.save();
    throw new ValidationError('OTP already used', 'OTP_ALREADY_USED');
  }

  // Verify OTP
  if (!user.verifyOTP(otp)) {
    await user.save();
    throw new ValidationError('Invalid OTP', 'INVALID_OTP');
  }

  // Mark OTP as used and verify email
  user.markOTPAsUsed();
  user.isEmailVerified = true;
  user.lastLoginAt = new Date();
  user.clearOTP();
  await user.save();

  // Generate JWT tokens
  const { accessToken, refreshToken } = jwtService.generateTokenPair(user);

  // Set httpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Send welcome email
  await emailService.sendWelcomeEmail(user.email, user.name);

  logger.info(`Email verification successful for ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
      },
    },
  });
});

/**
 * POST /api/auth/signin
 * Email-based signin with OTP (for verified users)
 */
export const signin = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new NotFoundError('User not found. Please sign up first.', 'USER_NOT_FOUND');
  }

  // Check if user signed up with Google
  if (user.authProvider === 'google') {
    throw new AuthenticationError('Please use Google login', 'USE_GOOGLE_LOGIN');
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new AuthenticationError('Email not verified. Please complete signup first.', 'EMAIL_NOT_VERIFIED');
  }

  // Rate limiting: Check if last OTP was sent less than 30 seconds ago (same as resend-otp)
  if (user.otp && user.otp.lastAttemptAt) {
    const timeSinceLastOTP = Date.now() - user.otp.lastAttemptAt.getTime();
    const thirtySecondsInMs = 30 * 1000;
    
    if (timeSinceLastOTP < thirtySecondsInMs) {
      const remainingSeconds = Math.ceil((thirtySecondsInMs - timeSinceLastOTP) / 1000);
      throw new ValidationError(
        `Please wait ${remainingSeconds} seconds before requesting a new OTP`, 
        'OTP_RATE_LIMITED'
      );
    }
  }

  // Generate and send OTP for signin
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  const emailSent = await emailService.sendOTPEmail(user.email, otp, user.name);
  if (!emailSent) {
    throw new AppError('Failed to send OTP email', 500, 'EMAIL_SEND_FAILED');
  }

  logger.info(`Signin OTP sent to ${email}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email. Please verify to sign in.',
    data: {
      email: user.email,
    },
  });
});

/**
 * POST /api/auth/verify-signin-otp
 * Verify OTP for signin (for already verified users)
 */
export const verifySigninOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new AuthenticationError('Email not verified', 'EMAIL_NOT_VERIFIED');
  }

  // Increment OTP attempts
  user.incrementOTPAttempts();

  // Check if OTP is expired
  if (user.isOTPExpired()) {
    await user.save();
    throw new ValidationError('OTP expired', 'OTP_EXPIRED');
  }

  // Check if OTP is already used
  if (user.isOTPUsed()) {
    await user.save();
    throw new ValidationError('OTP already used', 'OTP_ALREADY_USED');
  }

  // Verify OTP
  if (!user.verifyOTP(otp)) {
    await user.save();
    throw new ValidationError('Invalid OTP', 'INVALID_OTP');
  }

  // Mark OTP as used and update login time
  user.markOTPAsUsed();
  user.lastLoginAt = new Date();
  user.clearOTP();
  await user.save();

  // Generate JWT tokens
  const { accessToken, refreshToken } = jwtService.generateTokenPair(user);

  // Set httpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);

  logger.info(`Signin successful for ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Signin successful',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
      },
    },
  });
});

/**
 * POST /api/auth/google-login
 * Google login - only for users who signed up with Google
 */
export const googleLogin = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  try {
    // Verify Google ID token
    const googleUser: GoogleUserInfo = await googleAuthService.verifyIdToken(idToken);

    // Find user by email
    const user = await User.findOne({ 
      email: googleUser.email.toLowerCase() 
    });

    if (!user) {
      throw new NotFoundError(
        'No account found with this email. Please sign up first.',
        'USER_NOT_FOUND'
      );
    }

    // Check if user signed up with email method
    if (user.authProvider === 'email') {
      throw new AuthenticationError(
        'This account was created with Email + OTP. Please sign in using Email + OTP method.',
        'USE_EMAIL_LOGIN'
      );
    }

    // Check if user signed up with Google but different Google ID
    if (user.authProvider === 'google' && user.googleId !== googleUser.id) {
      throw new AuthenticationError(
        'This email is associated with a different Google account.',
        'DIFFERENT_GOOGLE_ACCOUNT'
      );
    }

    // Ensure user has the correct Google ID
    if (user.authProvider === 'google' && !user.googleId) {
      user.googleId = googleUser.id;
    }

    // Update user info and last login
    user.name = googleUser.name;
    user.profilePicture = googleUser.picture || user.profilePicture;
    user.isEmailVerified = googleUser.verified_email;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT tokens
    const { accessToken, refreshToken } = jwtService.generateTokenPair(user);

    // Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`Google login successful for ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid Google token') {
      throw new AuthenticationError('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
    }
    throw error;
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP for email verification or signin
 */
export const resendOTP = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  // Check if user signed up with Google
  if (user.authProvider === 'google') {
    throw new ValidationError('Google users do not need OTP verification', 'NO_OTP_NEEDED');
  }

  // Basic rate limiting: Check if last OTP was sent less than 30 seconds ago (reduced for better UX)
  if (user.otp && user.otp.lastAttemptAt) {
    const timeSinceLastOTP = Date.now() - user.otp.lastAttemptAt.getTime();
    const thirtySecondsInMs = 30 * 1000; // Reduced from 60 seconds
    
    if (timeSinceLastOTP < thirtySecondsInMs) {
      const remainingSeconds = Math.ceil((thirtySecondsInMs - timeSinceLastOTP) / 1000);
      throw new ValidationError(
        `Please wait ${remainingSeconds} seconds before requesting a new OTP`, 
        'OTP_RATE_LIMITED'
      );
    }
  }

  // Generate and send new OTP (works for both verified and unverified users)
  const otp = user.generateOTP();
  await user.save();

  // Send OTP email
  const emailSent = await emailService.sendOTPEmail(user.email, otp, user.name);
  if (!emailSent) {
    throw new AppError('Failed to send verification email', 500, 'EMAIL_SEND_FAILED');
  }

  const logMessage = user.isEmailVerified 
    ? `Signin OTP resent to ${email}` 
    : `Signup OTP resent to ${email}`;
  logger.info(logMessage);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
});

/**
 * POST /api/auth/logout
 * Logout user (for future token blacklisting)
 */
export const logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  // Clear httpOnly cookies with same settings as when they were set
  const isProduction = process.env.NODE_ENV === 'production';
  
  const clearCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
  };
  
  res.clearCookie('accessToken', clearCookieOptions);
  res.clearCookie('refreshToken', clearCookieOptions);
  
  // In a production app, you might want to blacklist the token
  // For now, we'll just return a success response
  logger.info(`User ${req.user?._id} logged out`);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: {
        _id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        profilePicture: req.user.profilePicture,
        isEmailVerified: req.user.isEmailVerified,
        authProvider: req.user.authProvider,
        createdAt: req.user.createdAt,
        lastLoginAt: req.user.lastLoginAt,
      },
    },
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export const refreshToken = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required', 'MISSING_REFRESH_TOKEN');
  }

  try {
    // Verify the refresh token
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AuthenticationError('User not found', 'USER_NOT_FOUND');
    }

    // Check if user is still active
    if (!user.isEmailVerified && user.authProvider === 'email') {
      throw new AuthenticationError('Email not verified', 'EMAIL_NOT_VERIFIED');
    }

    // Generate new token pair
    const tokens = jwtService.generateTokenPair(user);

    // Set httpOnly cookies
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    logger.info(`Tokens refreshed for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider,
        },
      },
    });
  } catch (error: any) {
    // Handle JWT-related errors
    if (error.message?.includes('refresh token') || error.message?.includes('token')) {
      throw new AuthenticationError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }
    throw error;
  }
});

/**
 * POST /api/auth/check-user
 * Check if user exists and get their auth provider
 */
export const checkUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('Email is required');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  res.status(200).json({
    success: true,
    message: 'User check completed',
    exists: !!existingUser,
    authProvider: existingUser?.authProvider,
    isEmailVerified: existingUser?.isEmailVerified
  });
});