import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

// Types
interface User {
  _id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  authProvider: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signin: (email: string) => Promise<boolean>;
  login: (email: string, otp: string, keepLoggedIn?: boolean) => Promise<boolean>;
  signup: (name: string, email: string, dateOfBirth: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  resendOTP: (email: string) => Promise<{ success: boolean; waitTime?: number }>;
  googleSignup: (idToken: string) => Promise<boolean>;
  googleLogin: (idToken: string) => Promise<boolean>;
  checkUserExists: (email: string) => Promise<{ exists: boolean; authProvider?: string }>;
  logout: () => void;
  getStoredEmail: () => string | null;
  setStoredEmail: (email: string) => void;
  clearStoredEmail: () => void;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/me`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
          }
        } else if (response.status === 401) {
          // User is not authenticated, which is normal for first visit
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Helper function for API calls
  const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This enables httpOnly cookies
      };
      
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

      const data = await response.json();
      
      if (!response.ok) {
        // Handle validation errors specifically
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => `${err.field}: ${err.message}`).join('\n');
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        throw new Error(data.message || 'An error occurred');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Sign up function
  const signup = async (name: string, email: string, dateOfBirth: string): Promise<boolean> => {
    try {
      const response = await apiCall('/auth/signup', 'POST', {
        name,
        email,
        dateOfBirth
      });

      if (response.success) {
        // Store email for OTP verification
        setStoredEmail(email);
        toast.success('OTP sent to your email!');
        return true;
      }
      return false;
    } catch (error: any) {
      // Handle specific signup error cases
      if (error.message?.includes('Account already exists and is verified')) {
        toast.error('You already have an account! Redirecting to Sign In...', { duration: 3000 });
        // Auto-redirect to signin after a delay
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else if (error.message?.includes('Account exists but not verified')) {
        toast.error('Please check your email for OTP or resend it from Sign In page.', { duration: 4000 });
        // Redirect to signin for OTP verification
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else {
        toast.error(error.message || 'Signup failed');
      }
      return false;
    } finally {
      // Remove global loading state management
    }
  };

  // Login function (OTP-based)
  // Signin function (sends OTP to verified users)
  const signin = async (email: string): Promise<boolean> => {
    try {
      const response = await apiCall('/auth/signin', 'POST', { email });

      if (response.success) {
        // Don't show toast here when called from resend OTP
        return true;
      }
      return false;
    } catch (error: any) {
      // Handle specific signin error cases with better error extraction
      const errorCode = error.errorCode || error.details || error.error?.errorCode;
      const errorMessage = error.message || error.error?.message || 'Failed to send OTP';
      
      if (errorCode === 'USER_NOT_FOUND' || errorMessage.includes('User not found')) {
        toast.error('No account found with this email. Please sign up first!', { duration: 3000 });
        setTimeout(() => {
          window.location.href = '/signup';
        }, 2000);
      } else if (errorCode === 'USE_GOOGLE_LOGIN') {
        toast.error('This account uses Google authentication. Please use "Sign in with Google".');
      } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please complete your signup first by verifying your email.');
      } else if (errorCode === 'OTP_RATE_LIMITED' || errorCode === 'OTP_RATE_LIMIT_EXCEEDED') {
        // Extract the wait time from the error message
        const waitTimeMatch = errorMessage.match(/(\d+)\s*seconds?/);
        const waitTime = waitTimeMatch ? waitTimeMatch[1] : '30';
        toast.error(`Please wait ${waitTime} seconds before requesting another OTP.`);
      } else {
        toast.error(errorMessage);
      }
      return false;
    } finally {
      // Remove global loading state management
    }
  };

  // Login function (verify signin OTP)
  const login = async (email: string, otp: string, keepLoggedIn: boolean = false): Promise<boolean> => {
    try {
      const response = await apiCall('/auth/verify-signin-otp', 'POST', {
        email,
        otp
      });

      if (response.success && response.data) {
        const { user: userData } = response.data;
        
        // User data and tokens are now handled via httpOnly cookies
        setUser(userData);
        clearStoredEmail();
        toast.success(`Welcome back, ${userData.name}!`);
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      return false;
    } finally {
      // Remove global loading state management
    }
  };

  // Verify OTP function (for signup flow)
  const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      
      const response = await apiCall('/auth/verify-otp', 'POST', {
        email,
        otp
      });

      if (response.success && response.data) {
        const { user: userData } = response.data;
        
        // Auto-login after successful OTP verification - tokens handled via httpOnly cookies
        setUser(userData);
        clearStoredEmail();
        toast.success(`Welcome, ${userData.name}! Account verified successfully.`);
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
      return false;
    } finally {
      // Remove global loading state management
    }
  };

  // Resend OTP function
  const resendOTP = async (email: string): Promise<{ success: boolean; waitTime?: number }> => {
    try {
      const response = await apiCall('/auth/resend-otp', 'POST', { email });
      
      if (response.success) {
        // Don't show toast here - let the calling component handle it
        return { success: true };
      }
      return { success: false };
    } catch (error: any) {
      // Handle specific resend OTP errors with better error extraction
      const errorCode = error.errorCode || error.details || error.error?.errorCode;
      const errorMessage = error.message || error.error?.message || 'Failed to resend OTP';
      
      if (errorCode === 'USER_NOT_FOUND') {
        toast.error('Account not found. Please check your email or sign up first.');
      } else if (errorCode === 'OTP_RATE_LIMITED' || errorCode === 'OTP_RATE_LIMIT_EXCEEDED') {
        // Extract the wait time from the error message
        const waitTimeMatch = errorMessage.match(/(\d+)\s*seconds?/);
        const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 60;
        toast.error(`Please wait ${waitTime} seconds before requesting another OTP.`);
        return { success: false, waitTime };
      } else if (errorCode === 'NO_OTP_NEEDED') {
        toast.error('This account uses Google authentication. Please use "Sign in with Google".');
      } else {
        toast.error(errorMessage);
      }
      return { success: false };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API to clear httpOnly cookies
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Email storage for OTP flow
  const getStoredEmail = (): string | null => {
    return localStorage.getItem('tempEmail');
  };

  const setStoredEmail = (email: string) => {
    localStorage.setItem('tempEmail', email);
  };

  const clearStoredEmail = () => {
    localStorage.removeItem('tempEmail');
  };

  // Google Signup function
  const googleSignup = async (idToken: string): Promise<boolean> => {
    try {
      const response = await apiCall('/auth/google-signup', 'POST', {
        idToken
      });

      if (response.success && response.data) {
        const { user: userData } = response.data;
        
        // User data and tokens are now handled via httpOnly cookies
        setUser(userData);
        
        // Show appropriate message based on response
        if (response.message.includes('linked')) {
          toast.success(`Google account linked successfully! Welcome back, ${userData.name}!`);
        } else {
          toast.success(`Welcome, ${userData.name}!`);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      // Handle specific Google signup error cases
      if (error.message?.includes('An account with this email already exists')) {
        toast.error('You already have an email account! Please use Email + OTP sign in instead.', { duration: 4000 });
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else if (error.message?.includes('You already have an account with Google')) {
        toast.error('You already have a Google account! Please use Google Sign In instead.', { duration: 4000 });
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else if (error.message?.includes('This Google account is already registered')) {
        toast.error('This Google account already exists! Please use Google Sign In instead.', { duration: 4000 });
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
      } else {
        toast.error(error.message || 'Google signup failed');
      }
      return false;
    } finally {
      // Remove global loading state management
    }
  };

  // Google Login function
  const googleLogin = async (idToken: string): Promise<boolean> => {
    try {
      const response = await apiCall('/auth/google-login', 'POST', {
        idToken
      });

      if (response.success && response.data) {
        const { user: userData } = response.data;
        
        // User data and tokens are now handled via httpOnly cookies
        setUser(userData);
        
        // Show appropriate message based on response
        if (response.message.includes('linked')) {
          toast.success(`Google account linked successfully! Welcome back, ${userData.name}!`);
        } else {
          toast.success(`Welcome back, ${userData.name}!`);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      // Handle specific Google login error cases
      if (error.message?.includes('No account found with this email')) {
        toast.error('No Google account found. Please sign up with Google first!', { duration: 3000 });
        setTimeout(() => {
          window.location.href = '/signup';
        }, 2000);
      } else if (error.message?.includes('This account was created with Email + OTP')) {
        toast.error('This is an email account. Please use Email + OTP sign in instead!', { duration: 4000 });
        // Don't redirect, let them use email signin on same page
      } else {
        toast.error(error.message || 'Google login failed');
      }
      return false;
    } finally {
      // Remove global loading state management
    }
  };

  // Check if user exists and get their auth provider
  const checkUserExists = async (email: string): Promise<{ exists: boolean; authProvider?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          exists: data.exists,
          authProvider: data.authProvider
        };
      } else {
        console.error('Check user error:', data.message);
        return { exists: false };
      }
    } catch (error) {
      console.error('Check user error:', error);
      return { exists: false };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signin,
    login,
    signup,
    verifyOTP,
    resendOTP,
    googleSignup,
    googleLogin,
    checkUserExists,
    logout,
    getStoredEmail,
    setStoredEmail,
    clearStoredEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
