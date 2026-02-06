const express = require("express");
const router = express.Router();
const { verifyToken, isDoctor } = require("../middleware/authMiddleware");

router.get("/dashboard", verifyToken, isDoctor, (req, res) => {
    res.json({ message: "Doctor dashboard access granted" });
});

module.exports = router;
