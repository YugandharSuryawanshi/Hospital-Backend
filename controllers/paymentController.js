const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../config/db");

// init razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


exports.createOrder = async (req, res) => {
    try {
        const { bill_id } = req.body;

        if (!bill_id) {
            return res.status(400).json({ success: false, message: "Bill ID is required" });
        }

        console.log('bill id ' + bill_id);

        // get bill
        const [bill] = await pool.execute("SELECT final_amount FROM bills WHERE bill_id = ?",[bill_id]);

        if (bill.length === 0) {
            return res.status(404).json({ success: false, message: "Bill not found" });
        }

        const amount = bill[0].final_amount;

        // create razorpay order
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: "bill_" + bill_id,
        });

        // Insert Into Payments
        const res = pool.execute(`INSERT INTO payments(bill_id,razorpay_order_id,razorpay_payment_id,razorpay_signature,amount,currency,payment_method,payment_status)
            VALUES (?,?,?,?,?,?,?,?)`,
        [bill_id, ])

        res.json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID
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
            bill_id
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expected !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid payment" });
        }

        // update payment
        await pool.execute(
            `UPDATE payments SET razorpay_payment_id=?, razorpay_signature=?, payment_status='success' WHERE razorpay_order_id=?`,
            [razorpay_payment_id, razorpay_signature, razorpay_order_id]
        );

        // mark bill paid
        await pool.execute(`UPDATE bills SET bill_status='paid' WHERE bill_id=?`,[bill_id]);

        res.json({ success: true });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false });
    }
};
