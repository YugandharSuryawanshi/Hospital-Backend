const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.get("/dashboard-counts", verifyToken, isAdmin, adminController.getDashboardCounts);

router.get("/users", verifyToken, isAdmin, adminController.getAllUsers);

router.get('/getAllUsers', verifyToken, isAdmin, adminController.getUsers);

router.get("/getUser/:id", verifyToken, isAdmin, adminController.getUserById);

router.put("/profile", verifyToken, isAdmin, upload.single("image"), adminController.updateUser);

router.post("/slides", verifyToken, isAdmin, upload.single("slideImage"), adminController.addSlides);

router.get("/slides", verifyToken, isAdmin, adminController.getSlides);

// delete slide //working are remaining
router.delete("/slides/:id", verifyToken, isAdmin, adminController.deleteSlide);

router.post("/doctors", verifyToken, isAdmin, upload.single("dr_photo"), adminController.addDoctor);

router.get("/getdoctors", verifyToken, isAdmin, adminController.getAllDoctors);

router.delete("/deleteDoctor/:id", verifyToken, isAdmin, adminController.deleteDoctor);

router.put("/update_Doctor/:id", verifyToken, isAdmin, upload.single("dr_photo"), adminController.updateDoctor);

router.get("/appointments", verifyToken, isAdmin, adminController.getAllAppointments);

router.put("/updateAppointment/:id", verifyToken, isAdmin, adminController.updateAppointment);

router.post("/addFacility", verifyToken, isAdmin, upload.single("facility_image"), adminController.addFacility);

router.get("/getAllFacilities", verifyToken, isAdmin, adminController.getAllFacilities);

router.delete("/deleteFacility/:id", verifyToken, isAdmin, adminController.deleteFacility);

router.put("/updateFacility/:id", verifyToken, isAdmin, upload.single("facility_image"), adminController.updateFacility);

// update user Only Patients by Admin
router.put("/updateUser/:id", verifyToken, isAdmin, adminController.updatePatient);

router.delete("/deleteUser/:id", verifyToken, isAdmin, adminController.deletePatient);

router.post('/addDepartment', verifyToken, isAdmin, adminController.addDepartment);

router.get('/getDepartments', verifyToken, isAdmin, adminController.getDepartments);

router.put('/updateDepartment/:id', verifyToken, isAdmin, adminController.updateDepartment);

router.delete('/deleteDepartment/:id', verifyToken, isAdmin, adminController.deleteDepartment);

// Notifications
router.get('/notifications', verifyToken, isAdmin, adminController.getNotifications);
router.put("/notifications/read", verifyToken, isAdmin, adminController.markAsRead);
router.get('/notifications/unread-count', verifyToken, isAdmin, adminController.unreadCount);
router.delete("/deleteNotification/:id", verifyToken, isAdmin, adminController.deleteNotification);




module.exports = router;