import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  dateOfBirth?: Date;
  profilePicture?: string;
  isEmailVerified: boolean;
  authProvider: 'email' | 'google';
  googleId?: string;
  otp?: {
    code: string;
    expiresAt: Date;
    isUsed: boolean;
    attempts: number;
    lastAttemptAt: Date;
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateOTP(): string;
  verifyOTP(code: string): boolean;
  isOTPExpired(): boolean;
  isOTPUsed(): boolean;
  markOTPAsUsed(): void;
  incrementOTPAttempts(): void;
  clearOTP(): void;
}

const userSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: false, // Made completely optional for OTP-only auth
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function (password: string) {
          if (!password) return true; // Allow empty passwords
          // Password must contain at least one uppercase, one lowercase, one number, and one special character
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
          return passwordRegex.test(password);
        },
        message: 'Password too weak',
      },
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name must be less than 50 characters long'],
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    profilePicture: {
      type: String,
      default: undefined,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      required: true,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    otp: {
      code: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      isUsed: {
        type: Boolean,
        default: false,
      },
      attempts: {
        type: Number,
        default: 0,
      },
      lastAttemptAt: {
        type: Date,
        default: null,
      },
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to hash password
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate OTP
userSchema.methods.generateOTP = function (): string {
  const otpLength = parseInt(process.env.OTP_LENGTH || '6');
  const otp = Math.floor(Math.random() * Math.pow(10, otpLength))
    .toString()
    .padStart(otpLength, '0');
  
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  this.otp = {
    code: otp,
    expiresAt,
    isUsed: false,
    attempts: 0,
    lastAttemptAt: new Date(),
  };

  return otp;
};

// Instance method to verify OTP
userSchema.methods.verifyOTP = function (code: string): boolean {
  if (!this.otp || !this.otp.code) {
    return false;
  }

  if (this.isOTPExpired()) {
    return false;
  }

  if (this.isOTPUsed()) {
    return false;
  }

  return this.otp.code === code;
};

// Instance method to check if OTP is expired
userSchema.methods.isOTPExpired = function (): boolean {
  if (!this.otp || !this.otp.expiresAt) {
    return true;
  }
  return new Date() > this.otp.expiresAt;
};

// Instance method to check if OTP is already used
userSchema.methods.isOTPUsed = function (): boolean {
  return this.otp?.isUsed || false;
};

// Instance method to mark OTP as used
userSchema.methods.markOTPAsUsed = function (): void {
  if (this.otp) {
    this.otp.isUsed = true;
  }
};

// Instance method to increment OTP attempts
userSchema.methods.incrementOTPAttempts = function (): void {
  if (this.otp) {
    this.otp.attempts = (this.otp.attempts || 0) + 1;
    this.otp.lastAttemptAt = new Date();
  }
};

// Instance method to clear OTP
userSchema.methods.clearOTP = function (): void {
  this.otp = {
    code: undefined,
    expiresAt: undefined,
    isUsed: false,
    attempts: 0,
    lastAttemptAt: undefined,
  };
};

export const User = mongoose.model<IUser>('User', userSchema);
