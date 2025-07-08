import axios from 'axios';
import { API_CONFIG } from '../constants/config';

const JWT_TOKEN_KEY = 'ai_file_board_jwt_token';

const authApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true, // Important for cookies
});

interface AuthResponse {
  token: string;
  expiresIn: number;
  message: string;
}

interface UserResponse {
  userId: string;
  isAuthenticated: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: {
    status?: number;
    message: string;
  };
}

export const getJwtToken = (): string | null => {
  return localStorage.getItem(JWT_TOKEN_KEY);
};

export const setJwtToken = (token: string): void => {
  localStorage.setItem(JWT_TOKEN_KEY, token);
};

export const clearAllTokens = (): void => {
  localStorage.removeItem(JWT_TOKEN_KEY);
};

export const hasJwtToken = (): boolean => {
  return !!getJwtToken();
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getJwtToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
};

export const login = async (initialToken: string): Promise<LoginResult> => {
  try {
    console.log('Attempting to login with initial token');
    const response = await authApi.post<AuthResponse>('/auth/login', { token: initialToken });

    if (response.data && response.data.token) {
      console.log('Login successful, JWT received');
      setJwtToken(response.data.token);
      return { success: true };
    }
    return { 
      success: false, 
      error: { message: 'Login failed: Invalid response from server' } 
    };
  } catch (error) {
    console.error('Login failed:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      let message = 'Login failed';
      
      if (status === 401) {
        message = 'Bootstrap token likely expired. Please get a new token from Docker logs.';
      } else {
        message = 'There was an error during login. Please try again.';
      }
      
      return { 
        success: false, 
        error: { status, message } 
      };
    }
    
    return { 
      success: false, 
      error: { message: 'Network error. Please check your connection and try again.' } 
    };
  }
};

export const verifyAuth = async (): Promise<boolean> => {
  try {
    // If we don't have a token, we're not authenticated
    if (!hasJwtToken()) return false;

    // Check if the token is valid by making a request to the user endpoint
    const response = await authApi.get<UserResponse>('/auth/user', {
      headers: getAuthHeaders(),
    });

    return response.data.isAuthenticated === true;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    if (hasJwtToken()) {
      await authApi.post(
        '/auth/logout',
        {},
        {
          headers: getAuthHeaders(),
        },
      );
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    clearAllTokens();
  }
};
