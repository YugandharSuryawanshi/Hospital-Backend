// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.get("/users", verifyToken, isAdmin, adminController.getAllUsers);

router.put("/profile",verifyToken,isAdmin,upload.single("image"),adminController.updateUser);

router.post("/slides",verifyToken,isAdmin,upload.single("slideImage"),adminController.addSlides);

router.get("/slides", adminController.getSlides);

router.post("/doctors",verifyToken,isAdmin,upload.single("dr_photo"),adminController.addDoctor);

router.get("/getdoctors", adminController.getAllDoctors);

router.get("/appointments", adminController.getAllAppointments);

// delete slide
router.delete("/slides/:id", verifyToken, isAdmin, adminController.deleteSlide);

module.exports = router;
