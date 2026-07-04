const { Router } = require('express');
const authController = require('../controllers/authController');
const authRateLimit = require('../middlewares/auth-rate-limit');
const { ensureAuthenticated } = require('../../../middlewares/ensureAuthenticated');

const authRoutes = Router();

authRoutes.post('/register', authRateLimit, authController.register);
authRoutes.post('/login', authRateLimit, authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', ensureAuthenticated, authController.logout);

module.exports = authRoutes;
