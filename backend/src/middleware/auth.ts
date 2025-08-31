import { Request, Response, NextFunction } from 'express';
import { jwtService, TokenPayload } from '../utils/jwt';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from Authorization header first, then from cookies
    const authHeader = req.headers.authorization;
    let token = jwtService.extractTokenFromHeader(authHeader);
    
    // If no token in header, try to get from httpOnly cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        errorCode: 'MISSING_TOKEN',
      });
      return;
    }

    try {
      const decoded: TokenPayload = jwtService.verifyAccessToken(token);
      
      // Fetch user from database to ensure user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found',
          errorCode: 'USER_NOT_FOUND',
        });
        return;
      }

      // Check if user's email is verified (for certain endpoints)
      if (!user.isEmailVerified && req.path !== '/api/auth/verify-otp') {
        res.status(403).json({
          success: false,
          message: 'Email verification required',
          errorCode: 'EMAIL_NOT_VERIFIED',
        });
        return;
      }

      // Attach user to request object
      req.user = user;
      req.userId = (user as any)._id.toString();
      
      next();
    } catch (tokenError) {
      let errorMessage = 'Invalid token';
      let errorCode = 'INVALID_TOKEN';

      if (tokenError instanceof Error) {
        if (tokenError.message === 'Token expired') {
          errorMessage = 'Token expired';
          errorCode = 'TOKEN_EXPIRED';
        } else if (tokenError.message === 'Invalid token') {
          errorMessage = 'Invalid token';
          errorCode = 'INVALID_TOKEN';
        }
      }

      res.status(401).json({
        success: false,
        message: errorMessage,
        errorCode,
      });
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server unavailable',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Middleware to authenticate JWT tokens but allow unauthenticated requests
 */
export const optionalAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    try {
      const decoded: TokenPayload = jwtService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = (user as any)._id.toString();
      }
    } catch (tokenError) {
      // Token is invalid, but we continue without authentication
      logger.warn('Invalid token in optional authentication:', tokenError);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};

/**
 * Middleware to check if user is verified
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      errorCode: 'AUTHENTICATION_REQUIRED',
    });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      success: false,
      message: 'Email verification required',
      errorCode: 'EMAIL_NOT_VERIFIED',
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user owns the resource
 */
export const checkResourceOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const currentUserId = (req.user as any)._id.toString();

    if (resourceUserId && resourceUserId !== currentUserId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        errorCode: 'ACCESS_DENIED',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to rate limit authentication attempts
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `${clientIP}:${req.body.email || 'unknown'}`;

    // Clean up expired entries
    for (const [k, v] of attempts.entries()) {
      if (now > v.resetTime) {
        attempts.delete(k);
      }
    }

    const attemptData = attempts.get(key);
    
    if (attemptData) {
      if (now < attemptData.resetTime) {
        if (attemptData.count >= maxAttempts) {
          res.status(429).json({
            success: false,
            message: 'Too many authentication attempts. Please try again later.',
            errorCode: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((attemptData.resetTime - now) / 1000),
          });
          return;
        }
        attemptData.count++;
      } else {
        // Window expired, reset
        attempts.set(key, { count: 1, resetTime: now + windowMs });
      }
    } else {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
    }

    next();
  };
};
