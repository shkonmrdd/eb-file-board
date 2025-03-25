import { API_CONFIG } from '../constants/config';
import type { FileUploadResponse, BoardState } from '../types';
import { getJwtToken } from './auth';
import { connectSocket } from '../socket';
import axios from 'axios';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true
});

// Ensure auth headers are included with every request
api.interceptors.request.use(config => {
  // Add JWT token if available
  if (getJwtToken()) {
    const token = getJwtToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const uploadFile = async (file: File, boardName: string): Promise<FileUploadResponse> => {
  try {
    // Note: The backend will sanitize this boardName, replacing non-alphanumeric chars with underscores
    // For better debugging, log the original and expected sanitized versions
    console.log(`Uploading file to board: ${boardName} (will be sanitized to: ${boardName.replace(/[^a-z0-9\-]/gi, '_')})`);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("boardName", boardName);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Also ensure socket is connected with the current token
    connectSocket();

    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const loadBoardState = async (boardName: string): Promise<BoardState | null> => {
  try {
    // Sanitize board name to match backend sanitization
    const safeBoardName = boardName.replace(/[^a-z0-9\-]/gi, '_');
    const boardUrl = API_CONFIG.ENDPOINTS.BOARD.replace(':boardName', safeBoardName);
    
    const response = await api.get(boardUrl);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error("Error loading board state:", error);
    throw error;
  }
}; 