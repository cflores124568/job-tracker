const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validateRegister, validateLogin, validateChangePassword, validateResetPassword } = require('../utils/validators');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.post('/send-verification-email', authMiddleware, authController.sendVerificationEmail);
router.post('/verify-email', authController.verifyEmail);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, validateChangePassword, authController.changePassword);
router.post('/refresh', authMiddleware, authController.refreshToken);
router.get('/validate', authMiddleware, authController.validateToken);

module.exports = router;