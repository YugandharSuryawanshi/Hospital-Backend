const Razorpay = require("razorpay");
const crypto = require("crypto");
// const db = require("../config/config"); // your pool
const db = require("../config/db");

// init razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


exports.createOrder = async (req, res) => {
    try {
        console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
        console.log("KEY SECRET:", process.env.RAZORPAY_KEY_SECRET);

        const { doctor_id, patient_id } = req.body;
        // const patient_id = req.body; // from auth middleware

        // ==============================
        // 1. GET DOCTOR FEE
        // ==============================
        const [doctor] = await db.query(
            "SELECT dr_fee FROM doctors WHERE doctor_id=?",
            [doctor_id]
        );

        if (doctor.length === 0) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        const total_amount = doctor[0].dr_fee;
        const tax = 0;
        const discount = 0;
        const final_amount = total_amount + tax - discount;

        // ==============================
        // 2. CREATE BILL
        // ==============================
        const [billResult] = await db.query(
            `INSERT INTO bills
      (patient_id, reference_type, reference_id, total_amount, tax, discount, final_amount, bill_status)
      VALUES (?, 'appointment', NULL, ?, ?, ?, ?, 'unpaid')`,
            [patient_id, total_amount, tax, discount, final_amount]
        );

        const bill_id = billResult.insertId;

        // ==============================
        // 3. CREATE RAZORPAY ORDER
        // ==============================
        const order = await razorpay.orders.create({
            amount: final_amount * 100,
            currency: "INR",
            receipt: "bill_" + bill_id,
        });

        // ==============================
        // 4. CREATE PAYMENT ENTRY
        // ==============================
        await db.query(
            `INSERT INTO payments
      (bill_id, razorpay_order_id, amount, currency, payment_method, payment_status)
      VALUES (?, ?, ?, 'INR', 'online', 'created')`,
            [bill_id, order.id, final_amount]
        );

        res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            order,
            bill_id,
            amount: final_amount
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            appointmentData,
            bill_id
        } = req.body;

        // ==============================
        // VERIFY SIGNATURE
        // ==============================
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expected !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid payment" });
        }

        // ==============================
        // UPDATE PAYMENT
        // ==============================
        await db.query(
            `UPDATE payments
       SET razorpay_payment_id=?, razorpay_signature=?, payment_status='success'
       WHERE razorpay_order_id=?`,
            [razorpay_payment_id, razorpay_signature, razorpay_order_id]
        );

        // ==============================
        // MARK BILL PAID
        // ==============================
        await db.query(
            `UPDATE bills SET bill_status='paid' WHERE bill_id=?`,
            [bill_id]
        );

        // ==============================
        // CREATE APPOINTMENT
        // ==============================
        const [tokenResult] = await db.query(
            `SELECT COUNT(*) as total FROM appointments WHERE appointment_date=?`,
            [appointmentData.appointment_date]
        );

        const token_number = tokenResult[0].total + 1;

        const [appResult] = await db.query(
            `INSERT INTO appointments
      (patient_id, doctor_id, user_name, user_contact, user_email, user_address,
       appointment_date, appointment_time, notes, visit_type, payment_status, token_number, bill_id)
       VALUES (?,?,?,?,?,?,?,?,?,'offline','paid',?,?)`,
            [
                req.user.user_id,
                appointmentData.doctor_id,
                appointmentData.user_name,
                appointmentData.user_contact,
                appointmentData.user_email,
                appointmentData.user_address,
                appointmentData.appointment_date,
                appointmentData.appointment_time,
                appointmentData.notes,
                token_number,
                bill_id
            ]
        );

        const appointment_id = appResult.insertId;

        // ==============================
        // LINK BILL WITH APPOINTMENT
        // ==============================
        await db.query(
            `UPDATE bills SET reference_id=? WHERE bill_id=?`,
            [appointment_id, bill_id]
        );

        res.json({
            success: true,
            token_number
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};







// ✅ CREATE ORDER
// exports.createOrder = async (req, res) => {
//   try {
//     const { bill_id, amount } = req.body;

//     const options = {
//       amount: amount * 100, // paisa
//       currency: "INR",
//       receipt: "bill_" + bill_id,
//     };

//     const order = await razorpay.orders.create(options);

//     // store in DB
//     await db.query(
//       `INSERT INTO payments (bill_id, razorpay_order_id, amount, payment_method)
//        VALUES (?, ?, ?, 'online')`,
//       [bill_id, order.id, amount]
//     );

//     res.json({
//       success: true,
//       order,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, message: "Order failed" });
//   }
// };

// ✅ VERIFY PAYMENT
// exports.verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ success: false, message: "Invalid signature" });
//     }

//     // update payment
//     await db.query(
//       `UPDATE payments
//        SET razorpay_payment_id=?, razorpay_signature=?, payment_status='success'
//        WHERE razorpay_order_id=?`,
//       [razorpay_payment_id, razorpay_signature, razorpay_order_id]
//     );

//     // mark bill paid
//     await db.query(
//       `UPDATE bills b
//        JOIN payments p ON p.bill_id = b.bill_id
//        SET b.bill_status='paid'
//        WHERE p.razorpay_order_id=?`,
//       [razorpay_order_id]
//     );

//     res.json({ success: true, message: "Payment verified" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false });
//   }
// };


