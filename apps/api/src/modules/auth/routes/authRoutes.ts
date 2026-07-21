import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import type { AuthBody } from '../services/authService.js';
import { authRateLimit } from '../middlewares/auth-rate-limit.js';
import { ensureAuthenticated } from '../../../middlewares/ensureAuthenticated.js';

const authRoutes = Router();

authRoutes.post<Record<string, never>, unknown, AuthBody>('/register', authRateLimit, authController.register);
authRoutes.post<Record<string, never>, unknown, AuthBody>('/login', authRateLimit, authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', ensureAuthenticated, authController.logout);

export default authRoutes;
