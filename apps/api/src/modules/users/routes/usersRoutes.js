const { Router } = require('express');
const usersController = require('../controllers/usersController.js');
const { ensureAuthenticated } = require('../../../middlewares/ensureAuthenticated.js');
const upload = require('../multer');

const usersRoutes = Router();

usersRoutes.get('/health', (req, res) => { res.status(200).json({ status: 'ok' });});
usersRoutes.post('/upload', ensureAuthenticated, upload.single("file"), usersController.uploadFile);
usersRoutes.delete("/avatar", ensureAuthenticated, usersController.deleteAvatar);
usersRoutes.put('/apiKey', ensureAuthenticated, usersController.insertApiKey);
usersRoutes.get('/profile', ensureAuthenticated, usersController.getProfile);
usersRoutes.put('/profile', ensureAuthenticated, usersController.updateProfile);
usersRoutes.put('/change-password', ensureAuthenticated, usersController.changePassword);
usersRoutes.delete('/delete-account', ensureAuthenticated, usersController.deleteAccount);
usersRoutes.get("/preferences", ensureAuthenticated, usersController.getPreferences);
usersRoutes.put('/preferences', ensureAuthenticated, usersController.updatePreferences);

module.exports = usersRoutes;
