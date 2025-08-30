import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Create rate limiter for general API requests
export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

// Create rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
    });
  },
});

// Create rate limiter for OTP endpoints
export const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15)
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX || '15'), // Limit each IP to 15 OTP requests per windowMs (increased from 5)
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later.',
    errorCode: 'OTP_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many OTP requests, please try again later.',
      errorCode: 'OTP_RATE_LIMIT_EXCEEDED',
    });
  },
});

// Create rate limiter for signup endpoints
export const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 signup attempts per hour
  message: {
    success: false,
    message: 'Too many signup attempts, please try again later.',
    errorCode: 'SIGNUP_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many signup attempts, please try again later.',
      errorCode: 'SIGNUP_RATE_LIMIT_EXCEEDED',
    });
  },
});

// Create rate limiter for password reset endpoints
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    errorCode: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later.',
      errorCode: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    });
  },
});
