import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { initializeSocket } from "./socket/socket";
import { log } from "./utils";
import { socketAuth } from "./middleware/auth";
import { config } from "./config";

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  },
  maxHttpBufferSize: 100 * 1024 * 1024, // 100MB payload limit
});

// Apply socket authentication middleware with more logging
wss.use((socket, next) => {
  log(`Socket connection attempt from ${socket.handshake.address}`);
  log(`Socket auth headers: ${JSON.stringify(socket.handshake.headers)}`);
  log(`Socket auth data: ${JSON.stringify(socket.handshake.auth)}`);
  
  socketAuth(socket, next);
});

initializeSocket(wss);

// Only bind to localhost to prevent external access
httpServer.listen({
  port: port,
  host: '127.0.0.1'
}, () => {
  log(`Server running on port ${port}, bound to 127.0.0.1 (localhost only)`);
  
  if (config.auth.enabled) {
    log("Authentication is enabled.");
    if (process.env.API_TOKEN) {
      log("Using API token from environment variable");
    } else {
      log(`API Token (generated for this session only): ${config.auth.token}`);
      log("This token will be lost when the container restarts.");
      log("Set API_TOKEN environment variable for a persistent token.");
    }
    log(`To authenticate, include the '${config.auth.headerName}' header in your requests with this token.`);
  } else {
    log("WARNING: Authentication is disabled. This is not recommended for production.");
  }
});

process.on('SIGINT', () => {
  console.log("Gracefully shutting down...");
  process.exit(0);
});