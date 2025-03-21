import { API_CONFIG } from '../constants/config';
import type { FileUploadResponse, BoardState } from '../types';

export const uploadFile = async (file: File, boardName: string): Promise<FileUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("boardName", boardName);

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const loadBoardState = async (boardName: string): Promise<BoardState | null> => {
  try {
    const boardUrl = API_CONFIG.ENDPOINTS.BOARD.replace(':boardName', boardName);
    const response = await fetch(`${API_CONFIG.BASE_URL}${boardUrl}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to load board state: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error loading board state:", error);
    throw error;
  }
}; 