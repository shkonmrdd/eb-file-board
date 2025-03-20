import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { AppState } from "@excalidraw/excalidraw/types";

// Board types
export interface BoardState {
  elements: ExcalidrawElement[];
  appState?: AppState;
}

export interface BoardUpdatePayload {
  board: BoardState;
  boardName: string;
}

// File types
export type FileType = 'md' | 'pdf' | 'txt';

export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileType: FileType;
}

// Position types
export interface Position {
  x: number;
  y: number;
}

// Socket event types
export interface FileUpdatePayload {
  path: string;
  content: string;
} 