const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../config/db");

// init razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
exports.createOrder = async (req, res) => {
    try {
        const { bill_id } = req.body;

        if (!bill_id) {
            return res.status(400).json({ success: false, message: "Bill ID is required" });
        }

        //Get Bill
        const [billRows] = await pool.execute("SELECT final_amount FROM bills WHERE bill_id = ?", [bill_id]);

        if (billRows.length === 0) {
            return res.status(404).json({ success: false, message: "Bill not found" });
        }

        const amount = billRows[0].final_amount;

        //Create Razorpay Order // 100 is for paisa
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: "bill_" + bill_id,
        });

        //Check payment row exist or not
        const [paymentRows] = await pool.execute("SELECT payment_id FROM payments WHERE bill_id = ?", [bill_id]);

        if (paymentRows.length === 0) {
            await pool.execute(`INSERT INTO payments (bill_id, razorpay_order_id, amount, currency, payment_status)
                VALUES (?, ?, ?, ?, ?)`, [bill_id, order.id, amount, "INR", "created"]);
        } else {
            // UPDATE (retry case)
            await pool.execute(`UPDATE payments SET razorpay_order_id=?, amount=?, currency=?, payment_status='created' WHERE bill_id=?`,
                [order.id, amount, "INR", bill_id]);
        }

        //Send Response Frontend
        res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID, });

    } catch (error) {
        console.log("Create order error:", error);
        res.status(500).json({ success: false });
    }
};

//Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bill_id } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expected !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid payment" });
        }

        //Update Payment table
        await pool.execute(`UPDATE payments SET razorpay_payment_id=?, razorpay_signature=?, payment_status='success'
            WHERE razorpay_order_id=?`, [razorpay_payment_id, razorpay_signature, razorpay_order_id]);

        //Update Bill table
        await pool.execute(`UPDATE bills SET bill_status='paid' WHERE bill_id=?`, [bill_id]);

        //Update Appointments Table
        await pool.execute(`UPDATE appointments a
            JOIN bills b ON a.appointment_id = b.reference_id
            SET a.payment_status='paid' WHERE b.bill_id=?`, [bill_id]);

        res.json({ success: true });

    } catch (error) {
        console.log("Verify payment error:", error);
        res.status(500).json({ success: false });
    }
};

// Payment Failed
exports.paymentFailed = async (req, res) => {
    try {
        const { razorpay_order_id, bill_id } = req.body;

        //Update payments table
        await pool.execute(`UPDATE payments SET payment_status='failed' WHERE razorpay_order_id=?`,[razorpay_order_id]);

        //Update appointment table
        await pool.execute(`UPDATE appointments a
            JOIN bills b ON a.appointment_id = b.reference_id
            SET a.payment_status='failed' WHERE b.bill_id=?`, [bill_id]);

        res.json({ success: true });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};
