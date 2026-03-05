const pool = require("../config/db");
const { sendNotification } = require('../utils/notificationService')

exports.getDashboard = async (req, res) => {
    res.json({ message: "Welcome to the Doctor Dashboard" });
}

exports.getNotifications = async (req, res) => {
    const userId = req.user.id;
    const [rows] = await pool.execute(`SELECT * FROM notifications WHERE receiver_role='doctor' AND receiver_id=? ORDER BY created_at DESC`, [userId]);
    res.json(rows);
};

exports.unreadCount = async (req, res) => {
    const userId = req.user.id;
    const [[row]] = await pool.execute(`SELECT COUNT(*) AS count FROM notifications WHERE receiver_role='doctor'
        AND receiver_id=?
        AND is_read=FALSE`, [userId]);
    res.json({ count: row.count });
}

exports.markNotificationAsRead = async (req, res) => {
    const userId = req.user.id;
    await pool.execute(`UPDATE notifications SET is_read = true WHERE receiver_role='doctor' AND receiver_id=?`, [userId]);
    res.json({ message: "Marked as read" });
}



exports.getDoctorId = async (req, res) => {
    try {
        const user_id = req.user.id;
        console.log('Came User ID is :- ' + user_id);


        const [doctor] = await pool.execute("SELECT doctor_id FROM doctors WHERE user_id = ?", [user_id]);
        console.log('Found Doctor is :- ' + doctor);
        console.log('Found Doctor ID is :- ' + doctor[0].doctor_id);


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
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// 1️⃣ Doctor Stats
// =============================
exports.getDoctorStats = async (req, res) => {
    try {

        const doctor_id = req.params.doctor_id;

        console.log('Doctor ID IS Inside Stats  :- ' + doctor_id);


        const [today] = await pool.execute(
            `SELECT COUNT(*) as total_today
             FROM appointments
             WHERE doctor_id=? AND DATE(appointment_date)=CURDATE()`,
            [doctor_id]
        );

        const [waiting] = await pool.execute(
            `SELECT COUNT(*) as waiting
             FROM appointments
             WHERE doctor_id=? AND status='Pending'`,
            [doctor_id]
        );

        const [completed] = await pool.execute(
            `SELECT COUNT(*) as completed
             FROM appointments
             WHERE doctor_id=? AND status='Completed'`,
            [doctor_id]
        );

        const [cancelled] = await pool.execute(
            `SELECT COUNT(*) as cancelled
             FROM appointments
             WHERE doctor_id=? AND status='Cancelled'`,
            [doctor_id]
        );

        const [approved] = await pool.execute(
            `SELECT COUNT(*) as cancelled
             FROM appointments
             WHERE doctor_id=? AND status='Approved'`,
            [doctor_id]
        );

        res.json({
            total_today: today[0].total_today,
            waiting: waiting[0].waiting,
            completed: completed[0].completed,
            cancelled: cancelled[0].cancelled
        });

    } catch (err) {
        console.error("Doctor Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
};



// =============================
// 2️⃣ Patient Queue
// =============================
exports.getPatientQueue = async (req, res) => {

    try {

        const doctor_id = req.params.doctor_id;
        console.log('Doctor ID IS :- ' + doctor_id);


        const [rows] = await pool.execute(
            `SELECT appointment_id,
                    token_number,
                    user_name,
                    user_contact,
                    appointment_time,
                    status
             FROM appointments
             WHERE doctor_id=? 
             AND DATE(appointment_date)=CURDATE()
             ORDER BY token_number ASC`,
            [doctor_id]
        );

        res.json(rows);

    } catch (err) {
        console.error("Queue Error:", err);
        res.status(500).json({ error: err.message });
    }
};



// =============================
// 3️⃣ Today Appointments
// =============================
exports.getTodayAppointments = async (req, res) => {

    try {

        const doctor_id = req.params.doctor_id;

        const [rows] = await pool.execute(
            `SELECT appointment_id,
                    token_number,
                    user_name,
                    user_contact,
                    appointment_date,
                    appointment_time,
                    notes,
                    status
             FROM appointments
             WHERE doctor_id=?
             AND DATE(appointment_date)=CURDATE()
             ORDER BY appointment_time ASC`,
            [doctor_id]
        );

        res.json(rows);

    } catch (err) {
        console.error("Today Appointment Error:", err);
        res.status(500).json({ error: err.message });
    }
};



// =============================
// 4️⃣ Update Appointment Status
// =============================
exports.updateAppointmentStatus = async (req, res) => {

    try {

        const appointment_id = req.params.appointment_id;
        const { status } = req.body;

        await pool.execute(
            `UPDATE appointments 
             SET status=? 
             WHERE appointment_id=?`,
            [status, appointment_id]
        );

        res.json({ message: "Appointment status updated successfully" });

    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ error: err.message });
    }
};