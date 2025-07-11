import React from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

interface BoardWrapperProps {
  children: React.ReactNode;
  currentBoard: string;
  onLogout?: () => void;
  onNewBoard?: () => void;
}

const BoardWrapper: React.FC<BoardWrapperProps> = ({ children, currentBoard, onLogout, onNewBoard }) => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar currentBoard={currentBoard} onLogout={onLogout} onNewBoard={onNewBoard} />
      <div className="flex-1 flex flex-col">
        <TopBar currentBoard={currentBoard} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default BoardWrapper; 