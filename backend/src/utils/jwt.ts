import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { IUser } from '../models/User';

// Load environment variables
dotenv.config();

export interface TokenPayload {
  userId: string;
  email: string;
  isEmailVerified: boolean;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

class JWTService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets are not configured in environment variables');
    }
  }

  /**
   * Generate access token
   */
  generateAccessToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: (user as any)._id.toString(),
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'note-taking-app',
      audience: 'note-taking-app-users',
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string, tokenVersion: number = 0): string {
    const payload: RefreshTokenPayload = {
      userId,
      tokenVersion,
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'note-taking-app',
      audience: 'note-taking-app-users',
    } as jwt.SignOptions);
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'note-taking-app',
        audience: 'note-taking-app-users',
        clockTolerance: 60, // Allow 60 seconds of clock skew
      }) as TokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.error('JWT Verification Error:', error.message);
        throw new Error('Invalid token');
      } else {
        console.error('Token verification error:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'note-taking-app',
        audience: 'note-taking-app-users',
        clockTolerance: 60, // Allow 60 seconds of clock skew
      }) as RefreshTokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.error('Refresh JWT Verification Error:', error.message);
        throw new Error('Invalid refresh token');
      } else {
        console.error('Refresh token verification error:', error);
        throw new Error('Refresh token verification failed');
      }
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(user: IUser, tokenVersion: number = 0): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken((user as any)._id.toString(), tokenVersion),
    };
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1] || null;
  }

  /**
   * Get token expiry time in seconds
   */
  getTokenExpiry(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.exp || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return true;
    
    return Date.now() >= expiry * 1000;
  }
}

export const jwtService = new JWTService();
