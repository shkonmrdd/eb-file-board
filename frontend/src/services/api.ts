import { API_CONFIG } from '../constants/config';
import type { FileUploadResponse, BoardState, FileTreeNode } from '../types';
import { getJwtToken } from './auth';
import { connectSocket } from '../socket';
import { sanitizeBoardName } from '../utils/boardUtils';
import axios from 'axios';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
});

// Ensure auth headers are included with every request
api.interceptors.request.use((config) => {
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
    console.log(
      `Uploading file to board: ${boardName} (will be sanitized to: ${sanitizeBoardName(boardName)})`,
    );

    const formData = new FormData();
    formData.append('file', file);
    formData.append('boardName', boardName);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Also ensure socket is connected with the current token
    connectSocket();

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const loadBoardState = async (boardName: string): Promise<BoardState | null> => {
  try {
    // Sanitize board name to match backend sanitization
    const safeBoardName = sanitizeBoardName(boardName);
    const boardUrl = API_CONFIG.ENDPOINTS.BOARD.replace(':boardName', safeBoardName);

    const response = await api.get(boardUrl);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error('Error loading board state:', error);
    throw error;
  }
};

export const getBoardsList = async (): Promise<string[]> => {
  try {
    const response = await api.get('/api/boards');
    return response.data.boards || [];
  } catch (error) {
    console.error('Error fetching boards list:', error);
    throw error;
  }
};

// Fetch recursive file tree for a board
export const getFileTree = async (boardName: string): Promise<FileTreeNode[]> => {
  try {
    const safeBoardName = sanitizeBoardName(boardName);
    const response = await api.get(`/api/files/${safeBoardName}`);
    return response.data.files || [];
  } catch (error) {
    console.error('Error fetching file tree:', error);
    return [];
  }
};

// Fetch complete file tree from root (all boards)
export const getCompleteFileTree = async (): Promise<FileTreeNode[]> => {
  try {
    const response = await api.get('/api/files');
    return response.data.files || [];
  } catch (error) {
    console.error('Error fetching complete file tree:', error);
    return [];
  }
};

// Delete a board and all its contents
export const deleteBoard = async (boardName: string): Promise<void> => {
  try {
    // Sanitize board name to match backend sanitization (though backend also sanitizes)
    const safeBoardName = sanitizeBoardName(boardName);
    
    console.log(`Deleting board: ${boardName} (sanitized to: ${safeBoardName})`);
    
    const response = await api.delete(`/api/boards/${safeBoardName}`);
    
    console.log('Board deleted successfully:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Error deleting board:', error);
    
    // Re-throw with more specific error message if available
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw new Error('Failed to delete board');
  }
};
