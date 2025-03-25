import { io, Socket } from "socket.io-client";
import { BoardUpdatePayload, FileUpdatePayload } from "./types";
import { getJwtToken, login, getInitialToken } from "./services/auth";

// Determine the appropriate socket URL based on the environment
// In development mode, use the backend server URL explicitly
// In production, use relative path since frontend and backend are served from same origin
const SOCKET_URL = import.meta.env.PROD 
  ? "/" 
  : "http://localhost:3001";

// Define socket event types
interface ServerToClientEvents {
  "board-update": (data: BoardUpdatePayload) => void;
  "file-changed": (data: FileUpdatePayload) => void;
}

interface ClientToServerEvents {
  "update-state": (data: BoardUpdatePayload) => void;
  "update-file": (data: FileUpdatePayload) => void;
}

// Create a socket instance but do not connect immediately
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false, // Disable auto-connect
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true,
});

// Connection management
export const connectSocket = () => {
  const token = getJwtToken();
  if (token) {
    // Update auth with the latest token
    socket.auth = { token };
    socket.io.opts.extraHeaders = {
      Authorization: `Bearer ${token}`,
    };

    console.log("Connecting socket with JWT");
    socket.connect();
  } else {
    console.warn("Cannot connect socket: No JWT token available");
  }
};

// Connection status events
socket.on("connect", () => {
  console.log("Socket connected successfully");
});

// Handle connection error (likely auth issues)
socket.on("connect_error", async (err) => {
  console.error("Socket connection error:", err.message);
  
  // If auth error, try to use the initial token if available
  if (err.message.includes("Authentication")) {
    console.log("Authentication error detected");
    
    // Try to login with stored initial token if available
    const initialToken = getInitialToken();
    if (initialToken) {
      console.log("Initial token found, attempting login");
      const success = await login(initialToken);
      
      if (success) {
        console.log("Login successful, reconnecting socket with new JWT");
        // Update auth and reconnect
        socket.auth = { token: getJwtToken() };
        socket.io.opts.extraHeaders = {
          'Authorization': `Bearer ${getJwtToken() || ''}`
        };
        socket.connect();
      } else {
        console.warn("Login failed, socket will remain disconnected");
        // We'll need to wait for the user to re-enter credentials via the login form
        // This will happen automatically when they refresh or navigate to a protected route
      }
    } else {
      console.warn("No initial token available, user will need to log in via the login form");
      // Force a page reload to show the login form if we're on a protected route
      window.location.reload();
    }
  }
});

// Disconnection events
socket.on("disconnect", (reason) => {
  console.log(`Socket disconnected: ${reason}`);
  
  // Reconnect if we have a token and it wasn't a manual disconnection
  if (reason !== "io client disconnect" && getJwtToken()) {
    setTimeout(() => {
      console.log("Attempting to reconnect socket");
      connectSocket();
    }, 2000);
  }
});

// API
export const emitFileUpdate = (path: string, content: string): void => {
  if (!socket.connected) {
    console.warn("Socket not connected, attempting to connect");
    connectSocket();
    // Queue the update to be sent after connection
    socket.once("connect", () => {
      socket.emit("update-file", { path, content });
    });
  } else {
    socket.emit("update-file", { path, content });
  }
};