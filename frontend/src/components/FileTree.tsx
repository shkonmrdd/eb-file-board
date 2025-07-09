import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { File, Folder, FolderOpen, ChevronRight, Clipboard, Trash2 } from 'lucide-react';
import { FileTreeNode } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { deleteBoard } from '../services/api';
import { useFileTreeStore } from '../store/fileTreeStore';

interface DeleteButtonProps {
  node: FileTreeNode;
  onDelete: (boardName: string) => void;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ node, onDelete }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the board selection
    onDelete(node.name);
  };

  return (
    <button
      className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 ml-1 cursor-pointer"
      title={`Delete board: ${node.name}`}
      onClick={handleClick}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};

interface FileTreeProps {
  data: FileTreeNode[];
  height?: number | string;
  currentBoard?: string;
  onBoardSelect?: (boardName: string) => void;
  onTreeUpdate?: () => void; // Callback to refresh the tree after deletion
}

interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
  currentBoard?: string;
  onBoardSelect?: (boardName: string) => void;
  onToggle?: (nodeId: string) => void;
  isExpanded?: boolean;
  onTreeUpdate?: () => void;
  onDeleteBoard?: (boardName: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, currentBoard, onBoardSelect, onToggle, isExpanded = true, onTreeUpdate, onDeleteBoard }) => {
  const [localExpanded, setLocalExpanded] = useState(
    node.isBoard ? (currentBoard === node.name) : true
  );
  const hasChildren = node.children && node.children.length > 0;
  const shouldShowExpanded = isExpanded && localExpanded;
  const isCurrentBoard = node.isBoard && currentBoard === node.name;
  const canDeleteBoard = node.isBoard && node.name !== 'main';

  useEffect(() => {
    if (node.isBoard) {
      setLocalExpanded(currentBoard === node.name);
    }
  }, [currentBoard, node.isBoard, node.name]);

  const handleToggle = () => {
    if (node.isBoard) {
      onBoardSelect?.(node.name);
      setLocalExpanded(true);
    } else if (hasChildren) {
      setLocalExpanded(!localExpanded);
      onToggle?.(node.id);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-sm transition-colors group ${level === 0 ? 'pl-2' : ''
          } ${isCurrentBoard ? ' bg-[#e0dfff] dark:bg-[#403e6a]' : ''
          }`}
        style={{
          paddingLeft: `${8 + level * 16}px`,
        }}
        onClick={handleToggle}
      >
        {hasChildren ? (
          <div className="w-4 h-4 flex items-center justify-center">
            <ChevronRight className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${localExpanded ? 'rotate-90' : ''
              }`} />
          </div>
        ) : (
          <div className="w-4 h-4" />
        )}

        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
          {node.type === 'directory' ? (
            node.isBoard ? (
              <Clipboard className="w-4 h-4 text-black dark:text-white" />
            ) : localExpanded ? (
              <FolderOpen className="w-4 h-4 text-black dark:text-white" />
            ) : (
              <Folder className="w-4 h-4 text-black dark:text-white" />
            )
          ) : (
            <File className="w-4 h-4 text-black dark:text-white" />
          )}
        </div>

        <span className={`text-sm truncate flex-1 min-w-0 ${isCurrentBoard ? 'text-black dark:text-white font-medium' : 'text-black dark:text-white'
          }`}>
          {node.name}
        </span>

        {canDeleteBoard && (
          <DeleteButton node={node} onDelete={onDeleteBoard || (() => {})} />
        )}
      </div>

      {hasChildren && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${shouldShowExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              currentBoard={currentBoard}
              onBoardSelect={onBoardSelect}
              onToggle={onToggle}
              isExpanded={true}
              onTreeUpdate={onTreeUpdate}
              onDeleteBoard={onDeleteBoard}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ data, height = '100%', currentBoard, onBoardSelect, onTreeUpdate }) => {
  const navigate = useNavigate();
  const { fetchFileTree } = useFileTreeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shouldRefreshAfterNavigation, setShouldRefreshAfterNavigation] = useState(false);

  // Effect to handle refresh after navigation
  useEffect(() => {
    if (shouldRefreshAfterNavigation) {
      fetchFileTree();
      setShouldRefreshAfterNavigation(false);
    }
  }, [shouldRefreshAfterNavigation, fetchFileTree]);

  const handleDeleteClick = (boardName: string) => {
    setBoardToDelete(boardName);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!boardToDelete) return;

    setIsDeleting(true);
    try {
      await deleteBoard(boardToDelete);
      setIsModalOpen(false);
      setBoardToDelete(null);
      
      // Only navigate to root if we're deleting the currently selected board
      if (boardToDelete === currentBoard) {
        navigate('/');
        // Trigger refresh after navigation is complete
        setShouldRefreshAfterNavigation(true);
      } else {
        // Just refresh the tree without navigation
        fetchFileTree();
      }
      
      // Also call the prop callback if provided
      onTreeUpdate?.();
    } catch (error) {
      console.error('Failed to delete board:', error);
      // TODO: Add error toast notification here if you have a toast system
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsModalOpen(false);
    setBoardToDelete(null);
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        No files
      </div>
    );
  }

  return (
    <>
      <div
        className="overflow-y-auto overflow-x-hidden border border-gray-200 dark:border-[#38383f] rounded-md bg-white dark:bg-[#232329]"
        style={{ height, width: '100%' }}
      >
        <div className="p-1">
          {data.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              currentBoard={currentBoard}
              onBoardSelect={onBoardSelect}
              onTreeUpdate={onTreeUpdate}
              onDeleteBoard={handleDeleteClick}
            />
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Delete Board"
        message={`Are you sure you want to delete the board "${boardToDelete}"? This action cannot be undone and will permanently remove all files and data associated with this board.`}
        confirmText="Delete Board"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
};

export default FileTree; 