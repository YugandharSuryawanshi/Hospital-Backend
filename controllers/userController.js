const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Get User
exports.getUserById = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM users WHERE user_id=?", [req.params.id]);
        res.json(rows[0]);

    } catch (err) {
        console.error("getUsers error", err);
        res.status(500).json({ error: err.message });
    }
};

// Update User
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone;
        const address = req.body.address;
        const profile = req.file ? req.file.filename : null;

        if (req.file) {
            // update with image
            await pool.execute(
                "UPDATE users SET user_name = ?, user_email = ?, user_phone = ?, user_address = ?, user_profile = ? WHERE user_id = ?",
                [name, email, phone, address, profile, userId]
            );
        } else {
            // update without image
            await pool.execute(
                "UPDATE users SET user_name = ?, user_email = ?, user_phone = ?, user_address = ? WHERE user_id = ?",
                [name, email, phone, address, userId]
            );
        }

        const [rows] = await pool.execute(
            "SELECT user_id, user_name, user_email, user_phone, user_address, user_profile FROM users WHERE user_id = ?",
            [userId]
        );

        res.json({ message: "Profile updated", user: rows[0] });
    } catch (err) {
        console.error("updateUser error", err);
        res.status(500).json({ error: err.message });
    }
};

// Get SLides
exports.getSlides = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM slides");
        res.json(rows);
    } catch (err) {
        console.error("getSlides error", err);
        res.status(500).json({ error: err.message });
    }
};

// Get Some Doctors
exports.getSomeDoctors = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM doctors LIMIT 6");
        res.json(rows);
    } catch (err) {
        console.error("getSomeDoctors error", err);
        res.status(500).json({ error: err.message });
    }
}

// Get Facilities
exports.getFacilities = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM facilities");
        res.json(rows);
    } catch (err) {
        console.error("getFacilities error", err);
        res.status(500).json({ error: err.message });
    }
}

// Get Doctors
exports.getDoctors = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM doctors");
        res.json(rows);
    } catch (err) {
        console.error("getDoctors error", err);
        res.status(500).json({ error: err.message });
    }
}

// Get/Add Appointment
exports.addAppointment = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { doctor_id, user_name, user_contact, user_email, user_address, appointment_date, appointment_time, notes, paymentMode } = req.body;
        const visit_type = "offline";
        const payment_status = "pending";
        const finalPaymentMode = paymentMode === "online" ? "online" : "offline";
        const [doctorRows] = await pool.execute("SELECT * FROM doctors WHERE doctor_id = ?", [doctor_id]);
        const dr_fee = doctorRows[0].dr_fee;

        //Check Slot
        const [alreadyExisted] = await pool.execute(`SELECT * FROM appointments WHERE doctor_id=? AND appointment_date=?
            AND appointment_time=? AND status!='Cancelled'`, [doctor_id, appointment_date, appointment_time]);

        if (alreadyExisted.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This slot already booked. Select another after 5 min time."
            });
        }

        //Generate token number (per doctor per day)
        const [lastToken] = await pool.execute(`SELECT IFNULL(MAX(token_number),0) as last FROM appointments
            WHERE doctor_id=? AND appointment_date=?`, [doctor_id, appointment_date]);
        const token_number = lastToken[0].last + 1;
        const appointment_datetime = `${appointment_date} ${appointment_time}:00`;

        //Insert appointment
        const [result] = await pool.execute(`INSERT INTO appointments (doctor_id,user_id,user_name,user_contact,user_email,appointment_datetime,
            appointment_date,appointment_time,visit_type,payment_mode,payment_status,token_number,address,notes,status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [doctor_id, user_id, user_name, user_contact, user_email, appointment_datetime, appointment_date, appointment_time,
                visit_type || "offline", finalPaymentMode, payment_status, token_number, user_address, notes, "Pending"]);

        const appointment_id = result.insertId;

        //Create bill (consultation fee)
        const consultation_fee = dr_fee;
        // Create notification
        await pool.execute(`INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
            [user_id, "Appointment Get Successfully", `Your appointment Approval is Pending`]);

        // Real Time EMIT
        global.io.to(`user_${user_id}`).emit("new-notification", {
            title: "Get Appointment Successfully",
            message: `Your appointment status is now Pending Wait for Approval`
        });

        if (result) {
            const [bill] = await pool.execute(`INSERT INTO bills (patient_id, reference_type, reference_id, total_amount, final_amount)
                VALUES (?, 'appointment', ?, ?, ?)`, [user_id, appointment_id, consultation_fee, consultation_fee]);
            res.status(201).json({
                success: true,
                message: "Appointment booked..",
                appointment_id,
                bill_id: bill.insertId,
                token_number,
                paymentMode
            });
        }
        else {
            res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get bill
exports.getBill = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(`
            SELECT b.*,
                u.user_id,
                u.user_name AS patient_name,
                u.user_email AS patient_email,
                u.user_phone AS patient_contact,
                a.appointment_date AS appointment_date,
                a.appointment_time AS appointment_time,
                a.appointment_datetime AS appointment_datetime,
                a.payment_mode AS payment_mode,
                a.payment_status AS payment_status,
                a.token_number AS token_number,
                a.notes AS notes,
                a.status AS appointment_status,
                d.dr_name AS dr_name,
                d.dr_certificate AS dr_certificate,
                d.dr_position AS dr_position,
                d.dr_speciality As dr_speciality,
                d.dr_contact AS dr_contact
            FROM bills b
            JOIN users u ON b.patient_id = u.user_id
            JOIN appointments a ON b.reference_id = a.appointment_id
            JOIN doctors d ON a.doctor_id = d.doctor_id
            WHERE b.bill_id = ?`, [id]);

        res.json(rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Departments For Navbar
exports.getDepartments = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM departments WHERE department_status = 'active'");
        res.json(rows);
    } catch (err) {
        console.error("getDepartments error", err);
        res.status(500).json({ error: err.message });
    }
}

// Get Department By Id
exports.getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute("SELECT * FROM departments WHERE department_id = ?", [id]);
        res.json(rows[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Doctors By Department ID
exports.getDoctorsByDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(`SELECT d.*, dep.department_name FROM doctors d
            JOIN departments dep ON d.department_id = dep.department_id
            WHERE d.department_id = ? AND d.dr_status = 'Active'`, [id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get only user Appointments
exports.getMyAppointments = async (req, res) => {
    try {
        const user_id = req.user.id; //from jwt
        const [rows] = await pool.execute(`SELECT a.appointment_id, DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
            a.appointment_time, a.status, a.notes, a.token_number, a.payment_status,
            d.dr_name, d.dr_speciality,
            u.user_name AS user_name,
            b.bill_id AS bill_id
            FROM appointments a
            JOIN doctors d ON d.doctor_id = a.doctor_id
            JOIN users u ON u.user_id = a.user_id
            JOIN bills b ON b.reference_id = a.appointment_id
            WHERE a.user_id = ? ORDER BY a.created_at DESC;`, [user_id]);
        res.json(rows);
        
    } catch (err) {
        console.error("Get Appointments Error:", err);
        res.status(500).json({ message: "Failed to fetch appointments" });
    }
};

// Get Notifications
exports.getNotifications = async (req, res) => {
    const [rows] = await pool.execute(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id]);
    res.json(rows);
};

// Mark Notifications Read
exports.markAsRead = async (req, res) => {
    await pool.execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id]);
    res.json({ message: "Notifications marked as read" });
};

// Delete Notification from user
exports.deleteNotification = async (req, res) => {
    const { id } = req.params;
    await pool.execute(`DELETE FROM notifications WHERE notification_id = ? AND user_id = ?`, [id, req.user.id]);
    res.json({ message: "Notification deleted" });
};

// Get Unread Notification Count
exports.unreadCount = async (req, res) => {
    const userId = req.user.id;
    const [[row]] = await pool.execute(
        `SELECT COUNT(*) AS count FROM notifications WHERE user_id=? AND is_read=0`,
        [userId]
    );
    res.json({ count: row.count });
};

