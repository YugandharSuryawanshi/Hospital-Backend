const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Routes for authentication
router.post('/register', upload.single('image'), authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);

module.exports = router;