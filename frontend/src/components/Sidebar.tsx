import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { LogOut, FileText, RefreshCw, Plus } from 'lucide-react';
import FileTree from './FileTree';
import ConfirmationModal from './ConfirmationModal';
import { useFileTreeStore } from '../store/fileTreeStore';
import { useBoardStore } from '../store/boardStore';
import { deleteBoard } from '../services/api';

interface SidebarProps {
  currentBoard: string;
  onLogout?: () => void;
  onNewBoard?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentBoard, onLogout, onNewBoard }) => {
  const { fileTree, isLoadingFileTree, fetchFileTree } = useFileTreeStore();
  const { removeBoard } = useBoardStore();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch file tree when component mounts
  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  const handleBoardSelect = (boardName: string) => {
    if (boardName === 'main') {
      navigate('/');
    } else {
      navigate(`/${boardName}`);
    }
  };

  const handleBoardDeleteRequest = (boardName: string) => {
    setBoardToDelete(boardName);
    setShowDeleteModal(true);
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteBoard(boardToDelete);
      
      // Clean up board state from store
      removeBoard(boardToDelete);
      
      // Close modal
      setShowDeleteModal(false);
      setBoardToDelete(null);
      
      // Refresh file tree to reflect deletion
      await fetchFileTree();
      
      // Navigate to main board if we deleted the current board
      if (boardToDelete === currentBoard) {
        navigate('/');
      }
      
    } catch (error) {
      console.error('Failed to delete board:', error);
      alert(`Failed to delete board: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setBoardToDelete(null);
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-[#232329] border-r border-gray-200 dark:border-[#38383f] flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-[#38383f]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Files
          </h2>
          <div className="flex items-center gap-1">
            {onNewBoard && (
              <button
                onClick={onNewBoard}
                className="p-1 rounded-md bg-transparent border-none cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                title="New board"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={fetchFileTree}
              disabled={isLoadingFileTree}
              className="p-1 rounded-md bg-transparent border-none cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh file tree"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingFileTree ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 p-2 min-h-0">
          {isLoadingFileTree ? (
            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              Loading file tree...
            </div>
          ) : (
            <FileTree
              data={fileTree}
              height="100%"
              currentBoard={currentBoard}
              onBoardSelect={handleBoardSelect}
              onBoardDelete={handleBoardDeleteRequest}
            />
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      {onLogout && (
        <div className="p-4 border-t border-gray-200 dark:border-[#38383f]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium bg-transparent border-none cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Board"
        message={`Are you sure you want to delete the board "${boardToDelete}"? This will permanently delete the entire folder and all its contents. This action cannot be undone.`}
        confirmText="Delete Board"
        cancelText="Cancel"
        onConfirm={handleDeleteBoard}
        onCancel={handleCancelDelete}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Sidebar; 