import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { socket } from './socket.ts'
import { useBoardStore, useFileStore } from './store'

// Initialize socket listeners
const StoreInitializer = () => {
  const { syncBoard } = useBoardStore();
  
  useEffect(() => {
    // Listen for board updates
    socket.on('board-update', (payload) => {
      syncBoard(payload);
    });
    
    return () => {
      socket.off('board-update');
    };
  }, [syncBoard]);
  
  return null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreInitializer />
    <App />
  </StrictMode>,
)
