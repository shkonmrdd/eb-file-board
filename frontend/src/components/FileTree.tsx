import React, { useState, useEffect } from 'react';
import { File, Folder, FolderOpen, ChevronRight, Clipboard } from 'lucide-react';
import { FileTreeNode } from '../types';

interface FileTreeProps {
  data: FileTreeNode[];
  height?: number | string;
  currentBoard?: string;
  onBoardSelect?: (boardName: string) => void;
}

interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
  currentBoard?: string;
  onBoardSelect?: (boardName: string) => void;
  onToggle?: (nodeId: string) => void;
  isExpanded?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, currentBoard, onBoardSelect, onToggle, isExpanded = true }) => {
  const [localExpanded, setLocalExpanded] = useState(
    node.isBoard ? (currentBoard === node.name) : true
  );
  const hasChildren = node.children && node.children.length > 0;
  const shouldShowExpanded = isExpanded && localExpanded;
  const isCurrentBoard = node.isBoard && currentBoard === node.name;

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
        className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-sm transition-colors ${
          level === 0 ? 'pl-2' : ''
        } ${
          isCurrentBoard ? ' bg-[#e0dfff] dark:bg-[#403e6a]' : ''
        }`}
        style={{ 
          paddingLeft: `${8 + level * 16}px`,
        }}
        onClick={handleToggle}
      >
        {hasChildren ? (
          <div className="w-4 h-4 flex items-center justify-center">
            <ChevronRight className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
              localExpanded ? 'rotate-90' : ''
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

        <span className={`text-sm truncate flex-1 min-w-0 ${
          isCurrentBoard ? 'text-black dark:text-white font-medium' : 'text-black dark:text-white'
        }`}>
          {node.name}
        </span>
      </div>

      {hasChildren && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          shouldShowExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ data, height = '100%', currentBoard, onBoardSelect }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        No files
      </div>
    );
  }

  return (
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
          />
        ))}
      </div>
    </div>
  );
};

export default FileTree; 