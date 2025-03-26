import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { socket, connectSocket } from './socket.ts';
import { useBoardStore } from './store';
import { hasJwtToken } from './services/auth.ts';

// Initialize socket listeners
const StoreInitializer = () => {
  const { syncBoard } = useBoardStore();

  useEffect(() => {
    // Connect the socket only if we're authenticated
    if (hasJwtToken()) {
      connectSocket();
    }

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

// Root element
const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <StoreInitializer />
    <App />
  </StrictMode>,
);
