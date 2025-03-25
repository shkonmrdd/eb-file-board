import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/jwt.middleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes
router.get('/user', authenticateJWT, AuthController.getCurrentUser);
router.post('/refresh', authenticateJWT, AuthController.refreshToken);
router.post('/logout', authenticateJWT, AuthController.logout);

export default router; 