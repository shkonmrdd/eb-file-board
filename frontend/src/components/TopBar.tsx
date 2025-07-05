import React from 'react';

interface TopBarProps {
  currentBoard: string;
}

const TopBar: React.FC<TopBarProps> = ({ currentBoard }) => {
  return (
    <div className="h-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center px-4">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {currentBoard}
      </span>
    </div>
  );
};

export default TopBar; 