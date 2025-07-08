import { create } from 'zustand';
import {
  hasJwtToken,
  verifyAuth,
  login as apiLogin,
  logout as apiLogout,
  setJwtToken,
  type LoginResult,
} from '../services/auth';
import { connectSocket } from '../socket';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginAttempting: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (token: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: hasJwtToken(),
  isLoading: true,
  isLoginAttempting: false,

  initialize: async () => {
    try {
      if (hasJwtToken()) {
        console.log('Found JWT token, verifying...');
        const isValid = await verifyAuth();

        if (isValid) {
          console.log('JWT is valid');
          set({ isAuthenticated: true });
          connectSocket(); // Connect WebSocket after successful verification
          return;
        } else {
          console.log('JWT is invalid or expired');
        }
      }
      set({ isAuthenticated: false });
    } catch (error) {
      console.error('Authentication check failed:', error);
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (token: string) => {
    set({ isLoginAttempting: true });
    try {
      setJwtToken(token);
      const result = await apiLogin(token);

      if (result.success) {
        set({ isAuthenticated: true });
        connectSocket(); // Connect WebSocket after successful login
      } else {
        set({ isAuthenticated: false });
      }

      return result;
    } catch (error) {
      console.error('Login failed:', error);
      set({ isAuthenticated: false });
      return { 
        success: false, 
        error: { message: 'Unexpected error during login' } 
      };
    } finally {
      set({ isLoginAttempting: false });
    }
  },

  logout: async () => {
    await apiLogout();
    set({ isAuthenticated: false });
  },
}));
