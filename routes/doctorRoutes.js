const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController")
const { verifyToken, isDoctor } = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.get("/dashboard", verifyToken, isDoctor, doctorController.getDashboard);

router.get("/getDoctorID", verifyToken, isDoctor, doctorController.getDoctorId);

router.get("/stats/:doctorId", verifyToken, isDoctor, doctorController.getDoctorStats);

router.get("/appointments-week/:doctorId", verifyToken, isDoctor, doctorController.getDoctorChart);

router.get("/revenue/:doctorId", verifyToken, isDoctor, doctorController.revenueChart);

router.get("/recent/:doctorId", verifyToken, isDoctor, doctorController.recentAppointment);

router.get("/gender/:doctorId", verifyToken, isDoctor, doctorController.genderChart);



router.get('/notifications', verifyToken, isDoctor, doctorController.getNotifications);
router.put("/notifications/read", verifyToken, isDoctor, doctorController.markAsRead);
router.get('/notifications/unread-count', verifyToken, isDoctor, doctorController.unreadCount);
router.delete("/deleteNotification/:id", verifyToken, isDoctor, doctorController.deleteNotification);

module.exports = router;
