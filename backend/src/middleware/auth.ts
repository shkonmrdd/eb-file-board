import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { log } from '../utils';

// IP restriction middleware
export const ipRestriction = (req: Request, res: Response, next: NextFunction): void => {
  // Always allow OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  if (!config.network.allowedIPs.length) {
    next();
    return;
  }

  const clientIp = req.ip || 
                  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                  '0.0.0.0';
  
  if (config.network.allowedIPs.includes(clientIp)) {
    next();
    return;
  }

  log(`Access denied for IP: ${clientIp}`);
  res.status(403).send('Forbidden: Access restricted to specified IP addresses only');
};

// API key authentication middleware
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Always allow OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    next();
    return;
  }
  
  // Skip auth if disabled
  if (!config.auth.enabled) {
    next();
    return;
  }

  // Skip authentication for the frontend static files
  if (req.path === '/' || 
      req.path.startsWith('/assets/') || 
      req.path === '/index.html' || 
      req.path === '/favicon.ico') {
    next();
    return;
  }

  // Get token from header
  const apiKey = req.header(config.auth.headerName);
  
  if (!apiKey) {
    log(`Authentication failed: No API key provided for ${req.method} ${req.path}`);
    res.status(401).send('Unauthorized: API key required');
    return;
  }

  // Log token details for debugging (but mask most of the token)
  const tokenPreview = apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
  const correctTokenPreview = config.auth.token.substring(0, 4) + '...' + config.auth.token.substring(config.auth.token.length - 4);
  log(`Auth attempt: ${tokenPreview}, expected: ${correctTokenPreview}`);
  
  if (apiKey !== config.auth.token) {
    log(`Authentication failed: Invalid API key for ${req.method} ${req.path}`);
    res.status(403).send('Forbidden: Invalid API key');
    return;
  }

  log(`Authentication successful for ${req.method} ${req.path}`);
  next();
};

// Socket.IO authentication middleware
export const socketAuth = (socket: any, next: (err?: Error) => void): void => {
  if (!config.auth.enabled) {
    next();
    return;
  }

  // Check for API key in multiple places
  const apiKey = 
    // 1. Check auth object (recommended approach)
    socket.handshake.auth.token ||
    // 2. Check headers
    socket.handshake.headers[config.auth.headerName.toLowerCase()] ||
    // 3. Check query parameters
    socket.handshake.query?.token;

  if (!apiKey) {
    log('Socket authentication failed: No token provided');
    log(`Socket headers: ${JSON.stringify(socket.handshake.headers)}`);
    log(`Socket auth: ${JSON.stringify(socket.handshake.auth)}`);
    next(new Error('Authentication error: API key required'));
    return;
  }

  if (apiKey !== config.auth.token) {
    log('Socket authentication failed: Invalid token');
    next(new Error('Authentication error: Invalid API key'));
    return;
  }

  log('Socket authenticated successfully');
  next();
}; 