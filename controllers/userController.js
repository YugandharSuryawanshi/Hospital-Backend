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
        const user_id = req.user.id; // get from jwt
        const { doctor_id, user_name, user_contact, user_email, user_address, appointment_date, appointment_time, notes } = req.body;

        //Check (same doctor, same date, same time)
        const [alreadyExisted] = await pool.execute(`SELECT appointment_id FROM appointments WHERE doctor_id = ? AND appointment_date = ?
            AND appointment_time = ? AND status != 'Cancelled'`,
            [doctor_id, appointment_date, appointment_time]);

        if (alreadyExisted.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This time slot is not available for this doctor. Please choose another time."
            });
        }

        //Create datetime in backend
        const appointment_datetime = `${appointment_date} ${appointment_time}:00`;

        // Insert Appointment
        const [result] = await pool.execute(`INSERT INTO appointments(doctor_id,user_id,user_name,user_contact,user_email,address,
            appointment_date,appointment_time,appointment_datetime,notes,status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [doctor_id, user_id, user_name, user_contact, user_email, user_address, appointment_date, appointment_time, appointment_datetime,
                notes, 'Pending']);

        res.status(201).json({
            success: true, message: "Your appointment request has been submitted Successfully..!. Please wait for hospital approval.",
            appointment_id: result.insertId
        });

    } catch (err) {
        console.error("Add Appointment Error:", err);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
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
        const [rows] = await pool.execute(`SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.status, a.notes,
                d.dr_name, d.dr_speciality FROM appointments a
            JOIN doctors d ON d.doctor_id = a.doctor_id WHERE a.user_id = ? ORDER BY a.created_at DESC`, [user_id]);
        res.json(rows);
    } catch (err) {
        console.error("Get Appointments Error:", err);
        res.status(500).json({ message: "Failed to fetch appointments" });
    }
};