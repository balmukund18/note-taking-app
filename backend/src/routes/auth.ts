import { Router } from 'express';
import {
  signup,
  googleSignup,
  verifyOTP,
  signin,
  verifySigninOTP,
  googleLogin,
  resendOTP,
  logout,
  getProfile,
  refreshToken,
  checkUser,
} from '../controllers/authController';
import {
  validateSignup,
  validateGoogleSignup,
  validateSignin,
  validateLogin,
  validateOTPVerification,
  validateResendOTP,
  validateRefreshToken,
} from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { authRateLimit, otpRateLimit, signupRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/signup', signupRateLimit, validateSignup, signup);
router.post('/google-signup', signupRateLimit, validateGoogleSignup, googleSignup);
router.post('/verify-otp', otpRateLimit, validateOTPVerification, verifyOTP);
router.post('/signin', authRateLimit, validateSignin, signin);
router.post('/verify-signin-otp', otpRateLimit, validateOTPVerification, verifySigninOTP);
router.post('/google-login', authRateLimit, validateGoogleSignup, googleLogin);
router.post('/resend-otp', otpRateLimit, validateResendOTP, resendOTP);
router.post('/refresh', authRateLimit, validateRefreshToken, refreshToken);
router.post('/check-user', authRateLimit, checkUser);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getProfile);

export default router;
