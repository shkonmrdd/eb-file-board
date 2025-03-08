import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { initFileWatcher } from "./fileWatcher";
import { initializeSocket } from "./socket";
import { log } from "./utils";

const port = process.env.PORT || 3001;
const httpServer = http.createServer(app);
const wss = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize the file watcher and socket handlers
initFileWatcher(wss);
initializeSocket(wss);

httpServer.listen(port, () => {
  log(`Server running on port ${port}`);
});
