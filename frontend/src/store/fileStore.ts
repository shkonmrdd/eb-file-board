import { create } from 'zustand';
import { FileType } from '../types';
import { emitFileUpdate } from '../socket';

interface FileInfo {
  content: string;
  fileType: FileType;
  lastUpdated: Date;
}

interface FileStore {
  files: Record<string, FileInfo>;
  currentFile: string | null;
  setCurrentFile: (filePath: string | null) => void;
  updateFileContent: (path: string, content: string, fileType: FileType) => void;
  addFile: (path: string, content: string, fileType: FileType) => void;
  getFileContent: (path: string) => string | null;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: {},
  currentFile: null,

  setCurrentFile: (filePath) => set({ currentFile: filePath }),

  updateFileContent: (path, content, fileType) => {
    const state = get();
    const existingFile = state.files[path];

    // Check if content has actually changed
    if (existingFile && existingFile.content === content) {
      // Content hasn't changed, don't emit event or update store
      return;
    }

    set((state) => ({
      files: {
        ...state.files,
        [path]: {
          content,
          fileType,
          lastUpdated: new Date(),
        },
      },
    }));

    // Only emit socket event if content actually changed
    emitFileUpdate(path, content);
  },

  addFile: (path, content, fileType) => {
    const state = get();

    // Don't add if file already exists with same content
    if (state.files[path] && state.files[path].content === content) {
      return;
    }

    set((state) => ({
      files: {
        ...state.files,
        [path]: {
          content,
          fileType,
          lastUpdated: new Date(),
        },
      },
    }));
  },

  getFileContent: (path) => {
    const state = get();
    return state.files[path]?.content || null;
  },
}));
