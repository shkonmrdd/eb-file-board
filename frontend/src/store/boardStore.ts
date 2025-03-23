import { create } from 'zustand';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { AppState } from '@excalidraw/excalidraw/types';
import { BoardState, BoardUpdatePayload } from '../types';
import { socket } from '../socket';

interface BoardStore {
  currentBoard: string | null;
  boards: Record<string, BoardState>;
  setCurrentBoard: (boardName: string) => void;
  updateBoard: (boardName: string, elements: ExcalidrawElement[], appState: AppState) => void;
  syncBoard: (payload: BoardUpdatePayload) => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  currentBoard: null,
  boards: {},
  
  setCurrentBoard: (boardName) => set({ currentBoard: boardName }),
  
  updateBoard: (boardName, elements, appState) => {
    set((state) => {
      const updatedBoards = {
        ...state.boards,
        [boardName]: {
          elements,
          appState
        }
      };
      
      // Emit socket event for real-time collaboration
      // Note: The backend will sanitize boardName, preserving dashes but replacing other 
      // non-alphanumeric chars with underscores
      // See backend/src/socket/fileHandlers.ts and backend/src/app.ts
      socket.emit("update-state", {
        boardName,
        board: {
          elements,
          appState
        }
      });
      
      return { boards: updatedBoards };
    });
  },
  
  syncBoard: (payload) => {
    set((state) => ({
      boards: {
        ...state.boards,
        [payload.boardName]: payload.board
      }
    }));
  }
})); 