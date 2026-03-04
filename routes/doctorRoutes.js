const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController")
const { verifyToken, isDoctor } = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.get("/dashboard", verifyToken, isDoctor, doctorController.getDashboard);
router.get('/notifications', verifyToken, isDoctor, doctorController.getNotifications);
router.get('/notifications/unread-count', verifyToken, isDoctor, doctorController.unreadCount);
router.put('/notifications/mark-read', verifyToken, isDoctor, doctorController.markNotificationAsRead);

module.exports = router;
