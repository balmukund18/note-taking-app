import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Logo } from '../components/Logo';

interface LocationState {
  email?: string;
  isSignup?: boolean;
  message?: string;
}

export const OTPVerification: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingOTP, setIsResendingOTP] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  
  const { verifyOTP, login, resendOTP, signin, getStoredEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from either state or stored email
  const state = location.state as LocationState;
  const email = state?.email || getStoredEmail();
  const isSignup = state?.isSignup || false;
  const message = state?.message || 'Please enter the OTP sent to your email.';

  // Reset form function
  const resetForm = () => {
    setOtp('');
    setIsLoading(false);
    setIsResendingOTP(false);
    toast.dismiss(); // Clear any existing toasts
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        // Only reset if user has started typing OTP
        if (otp.trim() && !isLoading && !isResendingOTP) {
          resetForm();
          toast.success('OTP cleared!', { duration: 2000 });
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [otp, isLoading, isResendingOTP]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      toast.error('No email found. Please start the process again.');
      navigate(isSignup ? '/signup' : '/signin');
    } else {
      // Set initial countdown when user arrives (OTP was just sent)
      setCountdown(60);
    }
  }, [email, navigate, isSignup]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let success = false;
      
      if (isSignup) {
        // For signup, use verifyOTP (auto-login)
        success = await verifyOTP(email!, otp);
      } else {
        // For signin, use login (OTP verification for existing users)
        success = await login(email!, otp, false);
      }
      
      if (success) {
        // Add a small delay to ensure auth state is updated
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) return;
    
    setIsResendingOTP(true);
    try {
      // Use resendOTP endpoint for both signup and signin flows
      const result = await resendOTP(email);
      if (result.success) {
        setCountdown(60); // Default 60 second countdown
        toast.success('OTP sent successfully!');
      } else if (result.waitTime) {
        // Use the actual wait time from backend if available
        setCountdown(result.waitTime);
      }
      
      // Error handling is done in the resendOTP function
    } catch (error) {
      console.error('Resend OTP error:', error);
      // Additional fallback error handling
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsResendingOTP(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div ref={formRef} className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-center">
            {/* Logo Section */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <Logo size="md" />
            </div>
            <h2 className="mt-2 sm:mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Verify Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {email}
            </p>
          </div>

          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Enter 6-digit OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center tracking-widest font-mono text-lg"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </div>

            <div className="flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResendingOTP || countdown > 0}
                className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isResendingOTP ? 'Sending...' : 'Resend OTP'}
              </button>
              
              {countdown > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">•</span>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {countdown}s
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <Link 
                to={isSignup ? "/signup" : "/signin"} 
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to {isSignup ? 'Sign Up' : 'Sign In'}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
