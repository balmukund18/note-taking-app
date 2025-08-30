import { OAuth2Client } from 'google-auth-library';
import { logger } from './logger';

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string | undefined;
  verified_email: boolean;
}

class GoogleAuthService {
  private client: OAuth2Client;
  private clientId: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID!;
    if (!this.clientId) {
      throw new Error('GOOGLE_CLIENT_ID environment variable is not configured');
    }

    this.client = new OAuth2Client(this.clientId);
  }

  /**
   * Verify Google ID token and extract user information
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      // Handle mock tokens in development
      if (process.env.NODE_ENV === 'development' && idToken.startsWith('ey')) {
        try {
          const decoded = JSON.parse(Buffer.from(idToken, 'base64').toString());
          if (decoded.email && decoded.name && decoded.sub) {
            logger.info('Using mock Google token for development');
            return {
              id: decoded.sub,
              email: decoded.email,
              name: decoded.name,
              picture: decoded.picture || undefined,
              verified_email: decoded.email_verified || true,
            };
          }
        } catch (mockError) {
          logger.warn('Failed to parse mock token, trying real verification');
        }
      }

      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      if (!payload.email || !payload.sub || !payload.name) {
        throw new Error('Incomplete user information from Google');
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified_email: payload.email_verified || false,
      };
    } catch (error) {
      logger.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Verify Google access token (alternative method)
   */
  async verifyAccessToken(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo: any = await response.json();

      if (!userInfo.email || !userInfo.id || !userInfo.name) {
        throw new Error('Incomplete user information from Google');
      }

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture || undefined,
        verified_email: userInfo.verified_email || false,
      };
    } catch (error) {
      logger.error('Google access token verification failed:', error);
      throw new Error('Invalid Google access token');
    }
  }

  /**
   * Get client ID for frontend use
   */
  getClientId(): string {
    return this.clientId;
  }
}

export const googleAuthService = new GoogleAuthService();
