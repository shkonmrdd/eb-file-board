import { Server as SocketServer } from "socket.io";
import * as fileHandlers from "./fileHandlers";
import { log } from "../utils";

export const initializeSocket = (io: SocketServer): void => {
  io.on("connection", (socket) => {
    log("Client connected");

    socket.on("update-file", fileHandlers.handleFileUpdate);
    socket.on("update-state", fileHandlers.handleStateUpdate);

    socket.on("disconnect", () => {
      log("Client disconnected");
    });
  });
};