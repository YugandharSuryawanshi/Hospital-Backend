const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Routes for authentication
router.post('/register', upload.single('image'), authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);

// Router for user Authentication
// router.post('/user_login', authController.user_login);
// router.get('/user_me', verifyToken, authController.user_me);

module.exports = router;