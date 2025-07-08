import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { initializeSocket } from "./socket/socket";
import { log, getCorsOrigins } from "./utils";
import { authenticateSocketJWT } from "./middleware/jwt.middleware";
import { getInitialToken } from "./services/auth.service";

const port = process.env.PORT || 3001;
const host = process.env.HOST || '127.0.0.1';
const httpServer = http.createServer(app);

const corsOrigins = getCorsOrigins();
console.log(`WebSocket CORS configured with allowed origins: ${corsOrigins.join(', ')}`);

const wss = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  maxHttpBufferSize: 100 * 1024 * 1024, // 100MB payload limit
});

// Apply socket authentication middleware with more logging
wss.use((socket, next) => {
  log(`Socket connection attempt from ${socket.handshake.address}`);
  log(`Socket handshake query: ${JSON.stringify(socket.handshake.query)}`);
  
  authenticateSocketJWT(socket, next);
});

initializeSocket(wss);

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    console.log("ERROR:\nJWT_SECRET env variable is not set. Exiting...");
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.log("ERROR:\nJWT_SECRET env variable is short. Please set a secure secret to run this app.");
    process.exit(1);
  }
  if (!process.env.HOST) {
    console.log("ERROR:\nHOST env variable is not set. Exiting...");
    process.exit(1);
  }
}
// This makes the server accessible from outside the Docker container
httpServer.listen({
  port: port,
  host: host,
}, () => {
  log(`Server running on ${host}:${port}`);
  
  // Get initial token
  getInitialToken();
  
  log("JWT Authentication is enabled.");
  log(`For initial setup, use INITIAL LOGIN TOKEN`);
});

process.on('SIGINT', () => {
  console.log("Gracefully shutting down...");
  process.exit(0);
});