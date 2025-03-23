import { ExcalidrawImperativeAPI, AppState } from "@excalidraw/excalidraw/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { DragEvent as ReactDragEvent } from 'react';

// Board types
export interface BoardState {
  elements: ExcalidrawElement[];
  appState: AppState;
}

export interface BoardUpdatePayload {
  boardName: string;
  board: {
    elements: ExcalidrawElement[];
    appState: AppState;
  };
}

// File types
export type FileType = 'md' | 'pdf' | 'txt';

export interface FileUploadResponse {
  fileUrl: string;
  success: boolean;
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

export interface UseDragAndDropProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  boardName: string;
}

export interface UseDragAndDropResult {
  handleDrop: (event: ReactDragEvent<HTMLDivElement> | DragEvent) => Promise<boolean>;
  cursorPositionRef: React.MutableRefObject<Position>;
}

export interface BoardStore {
  boards: Record<string, BoardState>;
  currentBoard: string | null;
  updateBoard: (boardName: string, elements: ExcalidrawElement[], appState: AppState) => void;
  setCurrentBoard: (boardName: string) => void;
} 