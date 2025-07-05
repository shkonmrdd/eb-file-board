import { create } from 'zustand';
import { FileTreeNode } from '../types';
import { getCompleteFileTree } from '../services/api';

interface FileTreeState {
  fileTree: FileTreeNode[];
  isLoadingFileTree: boolean;
  fetchFileTree: () => Promise<void>;
}

export const useFileTreeStore = create<FileTreeState>((set) => ({
  fileTree: [],
  isLoadingFileTree: false,

  fetchFileTree: async () => {
    set({ isLoadingFileTree: true });
    try {
      const data = await getCompleteFileTree();
      set({ fileTree: data, isLoadingFileTree: false });
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
      set({ isLoadingFileTree: false });
    }
  },
})); 