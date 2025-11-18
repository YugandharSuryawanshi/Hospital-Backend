const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get("/slides", userController.getSlides);
router.post("/addAppointment", userController.addAppointment);

// In future need some routes for user
// user profile & uploads //in future need to add user also login that time
// router.get('/profile', verifyToken, userController.getProfile);
// router.put('/profile', verifyToken, upload.single('image'), userController.updateProfile);
// router.post('/upload-images', verifyToken, upload.array('images', 10), userController.uploadUserImages);
// router.get('/images', verifyToken, userController.getUserImages);

module.exports = router;
