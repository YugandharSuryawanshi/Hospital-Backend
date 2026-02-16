const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/create-order", paymentController.createOrder);
router.post("/verify", paymentController.verifyPayment);
router.post("/payment-failed", paymentController.paymentFailed);
router.post("/cancel-appointment", paymentController.cancelAppointment);



module.exports = router;
