import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { body } from 'express-validator';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors: ValidationError[] = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
    });
    return;
  }

  next();
};

/**
 * Email validation rules
 */
export const validateEmail = (): ValidationChain => {
  return body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .trim()
    .isLength({ min: 5, max: 254 })
    .withMessage('Email must be between 5 and 254 characters');
};

/**
 * Password validation rules
 */
export const validatePassword = (): ValidationChain => {
  return body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password too weak');
};

/**
 * Name validation rules
 */
export const validateName = (): ValidationChain => {
  return body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces');
};

/**
 * OTP validation rules
 */
export const validateOTP = (): ValidationChain => {
  return body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
    .trim();
};

/**
 * Google ID token validation rules
 */
export const validateGoogleIdToken = (): ValidationChain => {
  return body('idToken')
    .notEmpty()
    .withMessage('Google ID token is required')
    .isString()
    .withMessage('Google ID token must be a string')
    .trim();
};

/**
 * Note title validation rules
 */
export const validateNoteTitle = (): ValidationChain => {
  return body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters');
};

/**
 * Note content validation rules
 */
export const validateNoteContent = (): ValidationChain => {
  return body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters');
};

/**
 * Note tags validation rules
 */
export const validateNoteTags = (): ValidationChain => {
  return body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          throw new Error('Each tag must be a non-empty string');
        }
        if (tag.length > 30) {
          throw new Error('Each tag must be less than 30 characters');
        }
      }
      
      return true;
    });
};

/**
 * Date of birth validation
 */
export const validateDateOfBirth = (): ValidationChain => {
  return body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }
      return true;
    });
};

/**
 * Signup validation middleware (OTP-only auth)
 */
export const validateSignup = [
  validateEmail(),
  validateName(),
  validateDateOfBirth(),
  handleValidationErrors,
];

/**
 * Google signup validation middleware
 */
export const validateGoogleSignup = [
  validateGoogleIdToken(),
  handleValidationErrors,
];

/**
 * Signin validation middleware (email only)
 */
export const validateSignin = [
  validateEmail(),
  handleValidationErrors,
];

/**
 * Login validation middleware (kept for backward compatibility)
 */
export const validateLogin = [
  validateEmail(),
  handleValidationErrors,
];

/**
 * OTP verification validation middleware
 */
export const validateOTPVerification = [
  validateEmail(),
  validateOTP(),
  handleValidationErrors,
];

/**
 * Resend OTP validation middleware
 */
export const validateResendOTP = [
  validateEmail(),
  handleValidationErrors,
];

/**
 * Create note validation middleware
 */
export const validateCreateNote = [
  validateNoteTitle(),
  validateNoteContent(),
  validateNoteTags(),
  handleValidationErrors,
];

/**
 * Update note validation middleware
 */
export const validateUpdateNote = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('content').optional().trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters'),
  validateNoteTags(),
  body('isPinned').optional().isBoolean().withMessage('isPinned must be a boolean'),
  body('isArchived').optional().isBoolean().withMessage('isArchived must be a boolean'),
  handleValidationErrors,
];

/**
 * Refresh token validation middleware
 */
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string')
    .trim(),
  handleValidationErrors,
];
