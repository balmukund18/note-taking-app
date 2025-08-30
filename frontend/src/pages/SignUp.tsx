import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { initializeGoogleAuth, signInWithGoogle } from '../services/googleAuth';
import { Logo } from '../components/Logo';
import { initializeMockGoogleAuth, mockGoogleSignIn } from '../services/mockGoogleAuth';

export const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup, googleSignup, setStoredEmail, checkUserExists } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!formData.dateOfBirth) {
      toast.error('Please select your date of birth');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // First check if user already exists
      const userCheck = await checkUserExists(formData.email);
      
      if (userCheck.exists) {
        if (userCheck.authProvider === 'google') {
          toast.error('This email is registered with Google. Please use "Sign in with Google" instead.');
          setIsLoading(false);
          return;
        } else {
          toast.error('Account already exists. Redirecting to Sign In...');
          setTimeout(() => {
            navigate('/signin');
          }, 1500);
          setIsLoading(false);
          return;
        }
      }

      // User doesn't exist, proceed with signup
      const success = await signup(formData.name, formData.email, formData.dateOfBirth);
      if (success) {
        // Navigate to OTP verification page instead of signin
        navigate('/otp-verification', { 
          state: { 
            email: formData.email,
            isSignup: true,
            message: 'Please verify your email with the OTP sent to complete registration.'
          }
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Auth on component mount
  useEffect(() => {
    initializeGoogleAuth().catch((error) => {
      console.error('Failed to initialize Google Auth:', error);
    });
  }, []);

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      
      let idToken: string;
      
      try {
        // Try real Google Auth first
        await initializeGoogleAuth();
        console.log('Starting Google sign-up...');
        idToken = await signInWithGoogle();
      } catch (googleError: any) {
        console.log('Real Google Auth failed, using mock:', googleError.message);
        
        // Fallback to mock auth for development
        if (googleError.message.includes('not configured') || 
            googleError.message.includes('Something went wrong')) {
          toast('Using development mode authentication...', { icon: 'ℹ️' });
          await initializeMockGoogleAuth();
          idToken = await mockGoogleSignIn();
        } else {
          throw googleError;
        }
      }
      
      console.log('Got ID token, calling backend...');
      const success = await googleSignup(idToken);
      if (success) {
        navigate('/dashboard');
      } else {
        toast.error('Google sign-up failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Google sign-up error:', error);
      
      // Provide specific error messages
      if (error.message.includes('cancelled')) {
        toast.error('Google sign-up was cancelled.');
      } else if (error.message.includes('timeout')) {
        toast.error('Google sign-up timed out. Please try again.');
      } else if (error.message.includes('popup')) {
        toast.error('Please allow popups for this site and try again.');
      } else {
        toast.error(error.message || 'Google sign-up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Join us to start taking notes
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Date of Birth Input */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              required
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="Enter your email address"
              required
            />
          </div>

          {/* Get OTP Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending OTP...
              </div>
            ) : (
              'Get OTP'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 sm:my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Sign Up Button */}
        <button 
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoading ? 'Signing up...' : 'Continue with Google'}
        </button>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
