const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.get("/users", verifyToken, isAdmin, adminController.getAllUsers);

router.get('/getAllUsers', verifyToken, isAdmin, adminController.getUsers);

router.get("/getUser/:id",verifyToken,isAdmin,adminController.getUserById);

router.put("/profile",verifyToken,isAdmin,upload.single("image"),adminController.updateUser);

router.post("/slides",verifyToken,isAdmin,upload.single("slideImage"),adminController.addSlides);

router.get("/slides", adminController.getSlides);

router.post("/doctors",verifyToken,isAdmin,upload.single("dr_photo"),adminController.addDoctor);

router.get("/getdoctors", adminController.getAllDoctors);

router.delete("/deleteDoctor/:id",verifyToken,isAdmin,adminController.deleteDoctor);

router.put("/updateDoctor/:id",verifyToken,isAdmin,upload.single("dr_photo"),adminController.editDoctor);

router.get("/appointments", adminController.getAllAppointments);

router.post("/addFacility",verifyToken,isAdmin,upload.single("facility_image"),adminController.addFacility);

router.get("/getAllFacilities", adminController.getAllFacilities);

router.delete("/deleteFacility/:id",verifyToken,isAdmin,adminController.deleteFacility);

router.put("/updateFacility/:id",verifyToken,isAdmin,upload.single("facility_image"),adminController.updateFacility);

// update user Only Patients by Admin
router.put("/updateUser/:id",verifyToken,isAdmin,adminController.updatePatient);

router.delete("/deleteUser/:id",verifyToken,isAdmin,adminController.deletePatient);



// delete slide //working are remaining
router.delete("/slides/:id", verifyToken, isAdmin, adminController.deleteSlide);

module.exports = router;