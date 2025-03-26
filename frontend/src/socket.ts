import { io, Socket } from 'socket.io-client';
import { BoardUpdatePayload, FileUpdatePayload } from './types';
import { getJwtToken } from './services/auth';

const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:3001';

interface ServerToClientEvents {
  'board-update': (data: BoardUpdatePayload) => void;
  'file-changed': (data: FileUpdatePayload) => void;
}

interface ClientToServerEvents {
  'update-state': (data: BoardUpdatePayload) => void;
  'update-file': (data: FileUpdatePayload) => void;
}

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
});

export const connectSocket = () => {
  if (socket.connected) {
    console.warn('Socket already connected');
    return;
  }

  const token = getJwtToken();
  if (token) {
    socket.auth = { token };
    socket.io.opts.extraHeaders = {
      Authorization: `Bearer ${token}`,
    };

    console.log('Connecting socket with JWT');
    socket.connect();
  } else {
    console.warn('Cannot connect socket: No JWT token available');
  }
};

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('connect_error', async (err) => {
  console.error('Socket connection error:', err.message);
});

socket.on('disconnect', (reason) => {
  console.log(`Socket disconnected: ${reason}`);

  // Reconnect if we have a token and it wasn't a manual disconnection
  if (reason !== 'io client disconnect' && getJwtToken()) {
    setTimeout(() => {
      console.log('Attempting to reconnect socket');
      connectSocket();
    }, 2000);
  }
});

export const emitFileUpdate = (path: string, content: string): void => {
  if (!socket.connected) {
    console.warn('Socket not connected, attempting to connect');
    connectSocket();
    // Queue the update to be sent after connection
    socket.once('connect', () => {
      socket.emit('update-file', { path, content });
    });
  } else {
    socket.emit('update-file', { path, content });
  }
};
