/**
 * Authentication service for the API and WebSocket
 */

// Get API token from localStorage or prompt if not available
const AUTH_TOKEN_KEY = 'ai_file_board_auth_token';

/**
 * Get the API token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Set the API token in localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Clear the API token from localStorage
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Check if the auth token exists
 */
export const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

/**
 * Request the auth token from the user
 */
export const promptForAuthToken = (): string | null => {
  const token = prompt('Please enter your API token:');
  if (token) {
    setAuthToken(token);
    // Show a message so the user can save their token
    alert(`Your API token has been saved: ${token}\n\nPlease make a note of this token for future use.`);
    return token;
  }
  return null;
};

/**
 * Get headers with authentication for fetch requests
 */
export const getAuthHeaders = (): Headers => {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.append('X-API-Key', token);
  }
  return headers;
};

/**
 * Verify the API token with the server
 */
export const verifyAuthToken = async (token: string): Promise<boolean> => {
  try {
    console.log(`Verifying token (starts with ${token.substring(0, 4)}...)`);
    
    // Use API_CONFIG to get the correct base URL
    const { API_CONFIG } = await import('../constants/config');
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.API}`;
    
    console.log(`Making verification request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': token
      }
    });
    
    const success = response.ok;
    console.log(`Token verification ${success ? 'succeeded' : 'failed'} with status: ${response.status}`);
    
    return success;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}; 