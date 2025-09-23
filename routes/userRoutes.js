// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');


router.get("/slides", userController.getSlides);
router.post("/addAppointment", userController.addAppointment);
// user profile & uploads
// router.get('/profile', verifyToken, userController.getProfile);
// router.put('/profile', verifyToken, upload.single('image'), userController.updateProfile);
// router.post('/upload-images', verifyToken, upload.array('images', 10), userController.uploadUserImages);
// router.get('/images', verifyToken, userController.getUserImages);

module.exports = router;
