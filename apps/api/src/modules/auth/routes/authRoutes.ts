import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authRateLimit } from '../middlewares/auth-rate-limit.js';
import { ensureAuthenticated } from '../../../middlewares/ensureAuthenticated.js';

const authRoutes = Router();

authRoutes.post('/register', authRateLimit, authController.register);
authRoutes.post('/login', authRateLimit, authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', ensureAuthenticated, authController.logout);

export default authRoutes;
