const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.get("/slides", userController.getSlides);
router.post("/addAppointment", userController.addAppointment);
router.get("/getFacilities", userController.getFacilities);
router.get("/getdoctors", userController.getDoctors);
router.post("/addAppointment", userController.addAppointment);
router.get("/profile/:id", userController.getUserById);
router.put("/updateProfile/:id", upload.single("image"), userController.updateUser);

// In future need some routes for user if need just uncomment
// user profile & uploads //in future need to add user also login that time
// router.get('/profile', verifyToken, userController.getProfile);
// router.put('/profile', verifyToken, upload.single('image'), userController.updateProfile);
// router.post('/upload-images', verifyToken, upload.array('images', 10), userController.uploadUserImages);
// router.get('/images', verifyToken, userController.getUserImages);

module.exports = router;
