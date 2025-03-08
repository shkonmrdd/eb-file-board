import { Server as SocketServer } from "socket.io";
import { handleFileUpdate } from "./fileHandlers";
import { log } from "../utils";

export const initializeSocket = (io: SocketServer): void => {
  io.on("connection", (socket) => {
    log("Client connected");

    socket.on("update-file", (payload) => handleFileUpdate(socket, payload));

    socket.on("disconnect", () => {
      log("Client disconnected");
    });
  });
};