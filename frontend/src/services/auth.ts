/**
 * Authentication service for the API and WebSocket using JWT
 */
import axios from 'axios';
import { API_CONFIG } from '../constants/config';

// Auth token storage
const JWT_TOKEN_KEY = 'ai_file_board_jwt_token';
const INITIAL_TOKEN_KEY = 'ai_file_board_initial_token';

// Axios instance for auth requests
const authApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true  // Important for cookies
});

// Types
interface AuthResponse {
  token: string;
  expiresIn: number;
  message: string;
}

interface UserResponse {
  userId: string;
  isAuthenticated: boolean;
}

/**
 * Get the JWT token from localStorage
 */
export const getJwtToken = (): string | null => {
  return localStorage.getItem(JWT_TOKEN_KEY);
};

/**
 * Set the JWT token in localStorage
 */
export const setJwtToken = (token: string): void => {
  localStorage.setItem(JWT_TOKEN_KEY, token);
};

/**
 * Get the initial login token
 */
export const getInitialToken = (): string | null => {
  return localStorage.getItem(INITIAL_TOKEN_KEY);
};

/**
 * Set the initial login token
 */
export const setInitialToken = (token: string): void => {
  localStorage.setItem(INITIAL_TOKEN_KEY, token);
};

/**
 * Clear all auth tokens from localStorage
 */
export const clearAllTokens = (): void => {
  localStorage.removeItem(JWT_TOKEN_KEY);
  localStorage.removeItem(INITIAL_TOKEN_KEY);
};

/**
 * Check if the JWT token exists
 */
export const hasJwtToken = (): boolean => {
  return !!getJwtToken();
};

/**
 * Get authorization headers for fetch/axios requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getJwtToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }
  return {};
};

/**
 * Login with initial token to get JWT
 */
export const login = async (initialToken: string): Promise<boolean> => {
  try {
    console.log('Attempting to login with initial token');
    const response = await authApi.post<AuthResponse>('/auth/login', { token: initialToken });
    
    if (response.data && response.data.token) {
      console.log('Login successful, JWT received');
      setJwtToken(response.data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};

/**
 * Refresh the JWT token
 */
export const refreshToken = async (): Promise<boolean> => {
  try {
    const token = getJwtToken();
    if (!token) return false;
    
    const response = await authApi.post<AuthResponse>('/auth/refresh', {}, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.token) {
      setJwtToken(response.data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

/**
 * Verify the user is authenticated
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    // If we don't have a token, we're not authenticated
    if (!hasJwtToken()) return false;
    
    // Check if the token is valid by making a request to the user endpoint
    const response = await authApi.get<UserResponse>('/auth/user', {
      headers: getAuthHeaders()
    });
    
    return response.data.isAuthenticated === true;
  } catch (error) {
    console.error('Auth verification failed:', error);
    
    // If the token is invalid, try to refresh it once
    try {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Try again with the new token
        const retryResponse = await authApi.get<UserResponse>('/auth/user', {
          headers: getAuthHeaders()
        });
        return retryResponse.data.isAuthenticated === true;
      }
    } catch (refreshError) {
      console.error('Token refresh during verification failed:', refreshError);
    }
    
    return false;
  }
};

/**
 * Logout - clears token and makes logout request
 */
export const logout = async (): Promise<void> => {
  try {
    if (hasJwtToken()) {
      await authApi.post('/auth/logout', {}, {
        headers: getAuthHeaders()
      });
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    clearAllTokens();
  }
}; 