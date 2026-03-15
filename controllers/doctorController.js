const pool = require("../config/db");
const { sendNotification } = require('../utils/notificationService')

// Doctor Dashboard
exports.getDashboard = async (req, res) => {
    res.json({ message: "Welcome to the Doctor Dashboard" });
};

// Get Doctor ID from User ID
exports.getDoctorId = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const [doctor] = await pool.execute("SELECT doctor_id FROM doctors WHERE user_id = ?", [doctor_id]);

        if (doctor.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        res.json({
            success: true,
            doctor_id: doctor[0].doctor_id
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// Doctor Stats
exports.getDoctorStats = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        const [patients] = await pool.execute(`SELECT COUNT(DISTINCT user_id) AS totalPatients FROM appointments WHERE doctor_id = ?`,
            [doctorId]);

        const [todayAppointments] = await pool.execute(`SELECT COUNT(*) AS todayAppointments FROM appointments WHERE doctor_id = ?
                AND DATE(appointment_date) = CURDATE()`, [doctorId]);

        const [upcoming] = await pool.execute(`SELECT COUNT(*) AS upcoming FROM appointments WHERE doctor_id = ?
                AND appointment_date > NOW()`, [doctorId]);

        const [completed] = await pool.execute(`SELECT COUNT(*) AS completed FROM appointments WHERE doctor_id = ?
                AND status = 'Complete'`, [doctorId]);

        res.json({
            totalPatients: patients[0].totalPatients,
            todayAppointments: todayAppointments[0].todayAppointments,
            upcoming: upcoming[0].upcoming,
            completed: completed[0].completed
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Weekly Appointment Chart
exports.getDoctorChart = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        const query = `SELECT DAYNAME(appointment_date) AS day, COUNT(*) AS appointments FROM appointments WHERE doctor_id = ?
            GROUP BY DAYNAME(appointment_date)`;

        const [data] = await pool.execute(query, [doctorId]);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Revenue Chart
exports.revenueChart = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        const query = `SELECT MONTHNAME(a.appointment_date) AS month, COUNT(a.appointment_id) * d.dr_fee AS revenue FROM appointments a
            JOIN doctors d ON a.doctor_id = d.doctor_id WHERE a.doctor_id = ? AND a.status = 'Complete'
            GROUP BY MONTH(a.appointment_date)
            ORDER BY MONTH(a.appointment_date)`;

        const [data] = await pool.execute(query, [doctorId]);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Recent Appointments
exports.recentAppointment = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        const query = `SELECT a.appointment_id, p.user_name AS patient_name, a.appointment_datetime, a.status FROM appointments a
        JOIN users p ON a.user_id = p.user_id WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC LIMIT 5`;

        const [data] = await pool.execute(query, [doctorId]);

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Patient Gender Chart
exports.genderChart = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        const query = `SELECT u.user_gender, COUNT(*) as count FROM appointments a
        JOIN users u ON a.user_id = u.user_id WHERE a.doctor_id = ? GROUP BY u.user_gender`;

        const [data] = await pool.execute(query, [doctorId]);

        res.json(data);
    } catch (err) {
        console.error("Gender Chart Error:", err);
        res.status(500).json({ error: err.message });
    }
};





// Notifications
// Get notifications
exports.getNotifications = async (req, res) => {
    try {
        const doctorID = req.user.id; // from verifyToken
        const [rows] = await pool.execute(`SELECT * FROM notifications WHERE receiver_role='doctor'
            AND receiver_id=? ORDER BY created_at DESC`, [doctorID]);
        res.json(rows);
    } catch (err) {
        console.error("getNotifications error", err);
        res.status(500).json({ error: err.message });
    }
};

//Get Unread notification Count
exports.unreadCount = async (req, res) => {
    try {
        const doctorID = req.user.id;
        const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM notifications WHERE receiver_role='doctor'
            AND receiver_id=? AND is_read = false`, [doctorID]);
        res.json({ count: rows[0].count });
    } catch (err) {
        console.error("unreadCount error", err);
        res.status(500).json({ error: err.message });
    }
};

//Mark Notification As Read
exports.markAsRead = async (req, res) => {
    try {
        const doctorID = req.user.id;
        await pool.execute(`UPDATE notifications SET is_read = true WHERE receiver_role='doctor' AND receiver_id=?`, [doctorID]);
        res.json({ message: "Marked as read" });
    } catch (err) {
        console.error("markNotificationAsRead error", err);
        res.status(500).json({ error: err.message });
    }
};

//Delete Notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute(`DELETE FROM notifications WHERE notification_id = ? AND receiver_id = ?`, [id, req.user.id]);
        res.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Delete Notification Error");
    }
};