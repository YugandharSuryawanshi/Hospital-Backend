const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require("multer");
const { isUser, verifyToken } = require('../middleware/authMiddleware');

const upload = multer({ dest: "uploads/" });

router.get("/slides", userController.getSlides);

router.get("/getFacilities", userController.getFacilities);

router.get("/getdoctors", userController.getDoctors);

router.get("/getSomeDoctors", userController.getSomeDoctors);

router.post("/addAppointment", verifyToken, isUser, userController.addAppointment);

router.get("/profile/:id", userController.getUserById);

router.put("/updateProfile/:id", upload.single("image"), userController.updateUser);

router.get("/getDepartments", userController.getDepartments);

router.get("/getDepartment/:id", userController.getDepartmentById);

router.get("/getDoctorsByDepartment/:id", userController.getDoctorsByDepartment);

router.get("/getMyAppointments", verifyToken, isUser, userController.getMyAppointments);

router.get("/bill/:id", verifyToken, userController.getBill);

// Notifications
router.get("/notifications", verifyToken, userController.getNotifications);

router.put("/notifications/read", verifyToken, userController.markAsRead);

router.delete("/deleteNotification/:id", verifyToken, userController.deleteNotification);

router.get("/notifications/unread-count", verifyToken, userController.unreadCount);



module.exports = router;
