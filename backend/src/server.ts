import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { initFileWatcher } from "./fileWatcher";
import { initializeSocket } from "./socket";
import { log } from "./utils";
import { frameManager } from "./sync/FrameManager";

const port = process.env.PORT || 3001;
const httpServer = http.createServer(app);
const wss = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize frames from existing folders
frameManager.initializeFromFolders().then(() => {
  log("Initialized frames from folders");
  
  // Initialize the file watcher and socket handlers
  initFileWatcher(wss);
  initializeSocket(wss);

  httpServer.listen(port, () => {
    log(`Server running on port ${port}`);
  });
});
