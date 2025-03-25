import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { initializeSocket } from "./socket/socket";
import { log } from "./utils";
import { authenticateSocketJWT } from "./middleware/jwt.middleware";
import { getInitialToken } from "./services/auth.service";

const port = process.env.PORT || 3001;
const httpServer = http.createServer(app);

// Determine appropriate CORS origin based on environment
const corsOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',') : 
  (process.env.NODE_ENV === 'production' ? 
    ['http://localhost:3001'] : 
    ['http://localhost:5173', 'http://localhost:3001']);

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

// Only bind to localhost to prevent external access
httpServer.listen({
  port: port,
  host: '127.0.0.1'
}, () => {
  log(`Server running on port ${port}, bound to 127.0.0.1 (localhost only)`);
  
  // Get initial token
  getInitialToken();
  
  log("JWT Authentication is enabled.");
  log(`For initial setup, use INITIAL LOGIN TOKEN`);
  log("After login, your browser will receive a JWT that does not expire.");
});

process.on('SIGINT', () => {
  console.log("Gracefully shutting down...");
  process.exit(0);
});