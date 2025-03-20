import { io, Socket } from "socket.io-client";
import { BoardUpdatePayload, FileUpdatePayload } from "./types";

const SOCKET_URL = import.meta.env.PROD ? "/" : "ws://localhost:3001";

// Define socket event types
interface ServerToClientEvents {
  "board-update": (data: BoardUpdatePayload) => void;
}

interface ClientToServerEvents {
  "update-state": (data: BoardUpdatePayload) => void;
  "update-file": (data: FileUpdatePayload) => void;
}

// Create typed socket instance
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL);

export const emitFileUpdate = (path: string, content: string): void => {
  socket.emit("update-file", { path, content });
};