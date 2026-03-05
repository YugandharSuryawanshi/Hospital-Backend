const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController")
const { verifyToken, isDoctor } = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.get("/dashboard", verifyToken, isDoctor, doctorController.getDashboard);
router.get('/getDoctorID/:id', verifyToken, isDoctor, doctorController.getDoctorId);
router.get("/doctor/stats/:doctor_id", verifyToken, isDoctor, doctorController.getDoctorStats);
router.get("/doctor/queue/:doctor_id", verifyToken, isDoctor, doctorController.getPatientQueue);
router.get("//doctor/todayAppointments/:doctor_id", verifyToken, isDoctor, doctorController.getTodayAppointments);
router.put("/doctor/updateStatus/:appointment_id", doctorController.updateAppointmentStatus);
router.get('/notifications', verifyToken, isDoctor, doctorController.getNotifications);
router.get('/notifications/unread-count', verifyToken, isDoctor, doctorController.unreadCount);
router.put('/notifications/mark-read', verifyToken, isDoctor, doctorController.markNotificationAsRead);

module.exports = router;
