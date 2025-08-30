// Mock Google Auth for development when OAuth is not properly configured
import { toast } from 'react-hot-toast';

export const initializeMockGoogleAuth = async () => {
  console.log('Mock Google Auth initialized');
  return true;
};

export const mockGoogleSignIn = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Simulate Google authentication dialog
    const proceed = window.confirm(
      '🔧 Development Mode: Google OAuth not configured.\n\n' +
      'Would you like to simulate Google sign-in?\n' +
      '(This will create a test account)\n\n' +
      'Click OK to proceed or Cancel to abort.'
    );
    
    if (proceed) {
      // Simulate a delay like real Google auth
      setTimeout(() => {
        // Create a mock JWT token (for development only)
        const mockIdToken = btoa(JSON.stringify({
          iss: 'accounts.google.com',
          aud: 'mock-client-id',
          sub: 'mock-user-id-' + Date.now(),
          email: 'testuser@gmail.com',
          name: 'Test User',
          picture: 'https://via.placeholder.com/96',
          email_verified: true,
          given_name: 'Test',
          family_name: 'User',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        }));
        
        toast.success('Mock Google authentication successful!');
        resolve(mockIdToken);
      }, 1000);
    } else {
      reject(new Error('Google sign-in was cancelled.'));
    }
  });
};
