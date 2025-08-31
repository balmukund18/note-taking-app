// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

console.log('Google Client ID:', GOOGLE_CLIENT_ID); // Debug log

export const initializeGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    // Check if Google Client ID is configured
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id.apps.googleusercontent.com') {
      reject(new Error('Google Client ID not configured'));
      return;
    }

    // Check if already loaded
    if (window.google?.accounts?.id) {
      console.log('Google Identity Services already loaded');
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });
        resolve(true);
        return;
      } catch (error) {
        console.error('Google re-initialization error:', error);
      }
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a bit for the script to fully initialize
      setTimeout(() => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: handleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
              use_fedcm_for_prompt: false,
            });
            console.log('Google Identity Services initialized successfully');
            resolve(true);
          } catch (error) {
            console.error('Google initialization error:', error);
            reject(new Error('Failed to initialize Google Identity Services'));
          }
        } else {
          reject(new Error('Failed to load Google Identity Services'));
        }
      }, 500);
    };
    script.onerror = () => reject(new Error('Failed to load Google script'));
    
    // Remove any existing script first
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    document.head.appendChild(script);
  });
};

let credentialResponseHandler: ((response: any) => void) | null = null;

const handleCredentialResponse = (response: any) => {
  if (credentialResponseHandler) {
    credentialResponseHandler(response);
  }
};

export const signInWithGoogle = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services not loaded. Please refresh the page and try again.'));
      return;
    }

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id.apps.googleusercontent.com') {
      reject(new Error('Google authentication is not properly configured.'));
      return;
    }

    console.log('Starting Google Sign-In with Client ID:', GOOGLE_CLIENT_ID);

    // Set up timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Google sign-in timeout. Please try again.'));
    }, 60000);

    credentialResponseHandler = (response) => {
      clearTimeout(timeout);
      console.log('Google credential response received:', response);
      if (response.credential) {
        resolve(response.credential);
      } else {
        reject(new Error('Google sign-in was cancelled or failed.'));
      }
    };

    try {
      // Create and render a proper Google Sign-In button
      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'google-signin-container';
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.top = '50%';
      buttonContainer.style.left = '50%';
      buttonContainer.style.transform = 'translate(-50%, -50%)';
      buttonContainer.style.zIndex = '10000';
      buttonContainer.style.backgroundColor = 'white';
      buttonContainer.style.padding = '30px';
      buttonContainer.style.borderRadius = '12px';
      buttonContainer.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
      buttonContainer.style.border = '1px solid #dadce0';
      buttonContainer.style.minWidth = '300px';
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.width = '100%';
      backdrop.style.height = '100%';
      backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
      backdrop.style.zIndex = '9999';
      backdrop.style.cursor = 'pointer';
      
      // Set up cleanup function
      const cleanup = () => {
        if (document.body.contains(backdrop)) {
          document.body.removeChild(backdrop);
        }
        if (document.body.contains(buttonContainer)) {
          document.body.removeChild(buttonContainer);
        }
        document.removeEventListener('keydown', keyHandler);
      };
      
      // Add click outside to close functionality
      backdrop.onclick = (e) => {
        if (e.target === backdrop) {
          clearTimeout(timeout);
          cleanup();
          reject(new Error('Google sign-in was cancelled.'));
        }
      };
      
      // Add keyboard support (ESC to close)
      const keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          clearTimeout(timeout);
          cleanup();
          reject(new Error('Google sign-in was cancelled.'));
        }
      };
      
      // Add title
      const title = document.createElement('div');
      title.textContent = 'Sign in with Google';
      title.style.marginBottom = '20px';
      title.style.textAlign = 'center';
      title.style.fontSize = '18px';
      title.style.fontWeight = '500';
      title.style.color = '#202124';
      buttonContainer.appendChild(title);

      // Add cancel button
      const cancelButton = document.createElement('button');
      cancelButton.innerHTML = '×';
      cancelButton.style.position = 'absolute';
      cancelButton.style.top = '10px';
      cancelButton.style.right = '15px';
      cancelButton.style.background = 'none';
      cancelButton.style.border = 'none';
      cancelButton.style.fontSize = '24px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.color = '#5f6368';
      cancelButton.style.width = '30px';
      cancelButton.style.height = '30px';
      cancelButton.style.borderRadius = '50%';
      cancelButton.style.display = 'flex';
      cancelButton.style.alignItems = 'center';
      cancelButton.style.justifyContent = 'center';
      cancelButton.onmouseover = () => {
        cancelButton.style.backgroundColor = '#f1f3f4';
      };
      cancelButton.onmouseout = () => {
        cancelButton.style.backgroundColor = 'transparent';
      };
      cancelButton.onclick = () => {
        clearTimeout(timeout);
        cleanup();
        reject(new Error('Google sign-in was cancelled.'));
      };
      buttonContainer.appendChild(cancelButton);

      // Add the containers to DOM
      document.body.appendChild(backdrop);
      document.body.appendChild(buttonContainer);

      // Add keyboard event listener
      document.addEventListener('keydown', keyHandler);

      // Render the Google button
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'filled_blue',
        size: 'large',
        width: '250',
        text: 'signin_with',
        shape: 'rectangular',
      });

      // Override the handler to include cleanup
      const originalHandler = credentialResponseHandler;
      credentialResponseHandler = (response) => {
        cleanup();
        if (originalHandler) {
          originalHandler(response);
        }
      };

      // Auto cleanup after timeout
      setTimeout(() => {
        cleanup();
      }, 60000);

    } catch (error) {
      clearTimeout(timeout);
      console.error('Google sign-in error:', error);
      reject(new Error('Failed to initiate Google sign-in. Please try again.'));
    }
  });
};

// Types for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}
