import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface APIError extends Error {
  statusCode?: number;
  errorCode?: string;
  details?: any;
  isOperational?: boolean;
}

/**
 * Custom error class for API errors
 */
export class AppError extends Error implements APIError {
  public statusCode: number;
  public errorCode: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create specific error types
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', errorCode: string = 'AUTH_ERROR') {
    super(message, 401, errorCode);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', errorCode: string = 'ACCESS_DENIED') {
    super(message, 403, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', errorCode: string = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', service?: string) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

/**
 * Handle specific MongoDB errors
 */
const handleMongoError = (error: any): AppError => {
  if (error.code === 11000) {
    // Duplicate key error
    const keyValue = error.keyValue || {};
    const field = Object.keys(keyValue)[0];
    const value = field ? keyValue[field] : 'unknown';
    
    if (field === 'email') {
      return new ConflictError('User already exists', 'USER_ALREADY_EXISTS');
    }
    
    return new ConflictError(`Duplicate ${field}: ${value}`, 'DUPLICATE_FIELD');
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
    return new ValidationError('Validation failed', errors);
  }

  if (error.name === 'CastError') {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
  }

  return new DatabaseError('Database operation failed');
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token', 'INVALID_TOKEN');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired', 'TOKEN_EXPIRED');
  }

  return new AuthenticationError('Authentication failed');
};

/**
 * Development error response
 */
const sendErrorDev = (err: APIError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    errorCode: err.errorCode || 'INTERNAL_ERROR',
    details: err.details,
    stack: err.stack,
    error: err,
  });
};

/**
 * Production error response
 */
const sendErrorProd = (err: APIError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: any = {
      success: false,
      message: err.message,
      errorCode: err.errorCode || 'INTERNAL_ERROR',
    };

    if (err.details) {
      response.details = err.details;
    }

    res.status(err.statusCode || 500).json(response);
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('Unexpected error:', err);
    
    res.status(500).json({
      success: false,
      message: 'Server unavailable',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (err.name === 'MongoError' || err.name === 'ValidationError' || err.name === 'CastError') {
    error = handleMongoError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  } else if (!(err instanceof AppError)) {
    // Convert unknown errors to AppError
    error = new AppError(
      process.env.NODE_ENV === 'development' ? err.message : 'Server unavailable',
      500,
      'INTERNAL_ERROR'
    );
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

/**
 * Catch async errors
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errorCode: 'ROUTE_NOT_FOUND',
  });
};

/**
 * Specific error factory functions
 */
export const createValidationError = (message: string, details?: any): ValidationError => {
  return new ValidationError(message, details);
};

export const createAuthError = (message: string, errorCode?: string): AuthenticationError => {
  return new AuthenticationError(message, errorCode);
};

export const createNotFoundError = (resource: string = 'Resource'): NotFoundError => {
  return new NotFoundError(`${resource} not found`, 'NOT_FOUND');
};

export const createConflictError = (message: string, errorCode?: string): ConflictError => {
  return new ConflictError(message, errorCode);
};
