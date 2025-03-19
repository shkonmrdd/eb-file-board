import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.PROD ? "/" : "ws://localhost:3001";

export const socket = io(SOCKET_URL);

export const emitFileUpdate = (path: string, content: string) => {
  socket.emit("update-file", { path, content });
};