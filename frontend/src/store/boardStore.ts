import { create } from 'zustand';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { AppState } from '@excalidraw/excalidraw/types';
import { BoardState, BoardUpdatePayload, FileData } from '../types';
import { socket } from '../socket';
import { getBoardsList } from '../services/api';

interface BoardStore {
  currentBoard: string | null;
  boards: Record<string, BoardState>;
  boardsList: string[];
  isLoadingBoardsList: boolean;
  setCurrentBoard: (boardName: string) => void;
  updateBoard: (
    boardName: string,
    elements: ExcalidrawElement[],
    appState: AppState,
    files?: Record<string, FileData>,
  ) => void;
  syncBoard: (payload: BoardUpdatePayload) => void;
  fetchBoardsList: () => Promise<void>;
}

export const useBoardStore = create<BoardStore>((set) => ({
  currentBoard: null,
  boards: {},
  boardsList: [],
  isLoadingBoardsList: false,

  setCurrentBoard: (boardName) => set({ currentBoard: boardName }),

  updateBoard: (boardName, elements, appState, files = {}) => {
    set((state) => {
      const updatedBoards = {
        ...state.boards,
        [boardName]: {
          elements,
          appState,
          files,
        },
      };

      // Emit socket event for real-time collaboration
      // Note: The backend will sanitize boardName, preserving dashes but replacing other
      // non-alphanumeric chars with underscores
      // See backend/src/socket/fileHandlers.ts and backend/src/app.ts
      socket.emit('update-state', {
        boardName,
        board: {
          elements,
          appState,
          files,
        },
      });

      return { boards: updatedBoards };
    });
  },

  syncBoard: (payload) => {
    set((state) => ({
      boards: {
        ...state.boards,
        [payload.boardName]: payload.board,
      },
    }));
  },

  fetchBoardsList: async () => {
    set({ isLoadingBoardsList: true });
    try {
      const boardsList = await getBoardsList();
      set({ boardsList, isLoadingBoardsList: false });
    } catch (error) {
      console.error('Failed to fetch boards list:', error);
      set({ isLoadingBoardsList: false });
    }
  },
}));
