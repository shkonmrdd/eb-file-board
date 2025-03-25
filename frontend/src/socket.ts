import { io, Socket } from "socket.io-client";
import { BoardUpdatePayload, FileUpdatePayload } from "./types";
import { getAuthToken, promptForAuthToken } from "./services/auth";

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

// Get auth token or prompt for it
const token = getAuthToken();
console.log("Initial auth token:", token ? "Found in localStorage" : "Not found");

if (!token) {
  console.log("No token found, prompting user");
  const newToken = promptForAuthToken();
  if (newToken) {
    console.log("Token provided by user");
  } else {
    console.warn("User did not provide a token");
  }
}

// Create typed socket instance with auth
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  auth: {
    token: getAuthToken()
  },
  extraHeaders: {
    "X-API-Key": getAuthToken() || ""
  },
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  withCredentials: true
});

// Add connection event handlers
socket.on("connect", () => {
  console.log("Socket connected successfully");
});

// Handle connection error (likely auth issues)
socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
  
  // If auth error, prompt for token again
  if (err.message.includes("Authentication")) {
    console.log("Authentication error detected, prompting for new token");
    const newToken = promptForAuthToken();
    if (newToken) {
      console.log("New token provided, reconnecting...");
      // Update auth and reconnect
      socket.auth = { token: newToken };
      socket.io.opts.extraHeaders = {
        "X-API-Key": newToken
      };
      socket.connect();
    } else {
      console.warn("User cancelled token input");
    }
  }
});

export const emitFileUpdate = (path: string, content: string): void => {
  socket.emit("update-file", { path, content });
};