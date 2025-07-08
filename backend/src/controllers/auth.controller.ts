import { Request, Response } from 'express';
import { generateToken, getInitialToken } from '../services/auth.service';
import { log } from '../utils';

/**
 * Authentication controller for login and token management
 */
export class AuthController {
  /**
   * Login endpoint - validates credentials and issues JWT
   */
  static login(req: Request, res: Response): void {
    try {
      const { token } = req.body;
      
      // For single-user mode, we compare with initial token
      // In a multi-user system, this would check against a database
      if (token !== getInitialToken()) {
        log('Login failed: Invalid token');
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      
      // Generate a new JWT for the device valid for ~365 days
      const jwt = generateToken();
      
      // Set token in cookie and return in response
      res.cookie('token', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.json({
        message: 'Authentication successful',
        token: jwt
      });
    } catch (error) {
      log(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ message: 'Authentication failed' });
    }
  }
  
  /**
   * Get current user info
   */
  static getCurrentUser(req: Request, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      res.json({
        userId: req.user.userId,
        isAuthenticated: true
      });
    } catch (error) {
      log(`Get user error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(500).json({ message: 'Failed to get user info' });
    }
  }
  
  /**
   * Logout endpoint - clears the auth cookie
   */
  static logout(req: Request, res: Response): void {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  }
} 