import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { log } from '../utils';

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

/**
 * JWT authentication middleware for Express
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  // Skip OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    next();
    return;
  }
  
  // Skip authentication for the frontend static files and public assets
  if (req.path === '/' || 
      req.path.startsWith('/assets/') || 
      req.path === '/index.html' || 
      req.path === '/favicon.ico') {
    next();
    return;
  }

  // Get token from header or cookie
  const token = extractToken(req);
  
  if (!token) {
    log(`JWT Authentication failed: No token provided for ${req.method} ${req.path}`);
    res.status(401).json({ message: 'Unauthorized: No authentication token provided' });
    return;
  }

  // Verify the token
  const payload = verifyToken(token);
  
  if (!payload) {
    log(`JWT Authentication failed: Invalid token for ${req.method} ${req.path}`);
    res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    return;
  }

  // Attach user info to request
  req.user = payload;
  log(`JWT Authentication successful for user ${payload.userId}`);
  next();
};

/**
 * Extract JWT token from request (header, cookie, or query)
 */
const extractToken = (req: Request): string | null => {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for token in cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Check for token in query parameters (less secure, but useful for WebSocket)
  if (req.query && req.query.token) {
    return req.query.token as string;
  }
  
  return null;
};

/**
 * WebSocket authentication middleware
 */
export const authenticateSocketJWT = (socket: any, next: (err?: Error) => void): void => {
  try {
    // Try to get token from handshake auth, headers, or query
    const token = 
      socket.handshake.auth.token ||
      (socket.handshake.headers.authorization?.startsWith('Bearer ') 
        ? socket.handshake.headers.authorization.substring(7) 
        : null) ||
      socket.handshake.query?.token;
    
    if (!token) {
      log('Socket authentication failed: No token provided');
      return next(new Error('Authentication error: JWT token required'));
    }
    
    // Verify the token
    const payload = verifyToken(token);
    if (!payload) {
      log('Socket authentication failed: Invalid token');
      return next(new Error('Authentication error: Invalid or expired token'));
    }
    
    // Attach user data to socket
    socket.user = payload;
    log(`Socket authenticated successfully for user ${payload.userId}`);
    next();
  } catch (error) {
    log(`Socket authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    next(new Error('Authentication error'));
  }
}; 