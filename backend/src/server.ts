import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { initializeSocket } from "./socket/socket";
import { log } from "./utils";

const port = process.env.PORT || 3001;
const httpServer = http.createServer(app);
const wss = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initializeSocket(wss);

httpServer.listen(port, () => {
  log(`Server running on port ${port}`);
});
