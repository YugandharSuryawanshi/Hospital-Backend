const pool = require('../config/db');
const bcrypt = require('bcryptjs');

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

// Add Appointment
exports.addAppointment = async (req, res) => {
    try {
        const { doctor_id, user_name, user_contact, user_email, appointment_datetime, notes } = req.body;

        // basic validation check below given info are came or not
        if (!user_name || !user_contact || !appointment_datetime) {
            return res.status(400).json({ error: "user_name, user_contact and appointment_datetime are required" });
        }

        const doctorId = doctor_id ? parseInt(doctor_id, 10) : null;

        // convert datetime-local (YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS) -> MySQL DATETIME "YYYY-MM-DD HH:MM:SS"
        let dt = appointment_datetime;
        if (typeof dt === "string" && dt.includes("T")) {
            // if seconds missing, add :00
            dt = dt.replace("T", " ");
            if (dt.length === 16) dt = dt + ":00";
        }

        const [result] = await pool.execute(
            `INSERT INTO appointments (doctor_id, user_name, user_contact, user_email, appointment_datetime, notes) VALUES (?, ?, ?, ?, ?, ?)`,
            [doctorId, user_name, user_contact, user_email || null, dt, notes || null]
        );

        // return Get created appointment using appointment_id
        const insertId = result.insertId;
        const [rows] = await pool.execute("SELECT * FROM appointments WHERE appointment_id = ?", [insertId]);

        return res.status(201).json({ appointment: rows[0] });
    } catch (err) {
        console.error("addAppointment error", err);
        return res.status(500).json({ error: err.message || "Server error" });
    }
};

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

// Get appointment
exports.addAppointment = async (req, res) => {
    try {
        const { doctor_id, user_name, user_contact, user_email, user_address, appointment_date,
            appointment_time, appointment_datetime, notes } = req.body;

        const [result] = await pool.execute(`INSERT INTO appointments
            (doctor_id, user_name, user_contact, user_email, appointment_datetime, address, appointment_date, appointment_time, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ doctor_id, user_name, user_contact, user_email, appointment_datetime, user_address, appointment_date, appointment_time, notes, 'Pending' ] );

        res.status(201).json({
            success: true,
            message: "Appointment Added Successfully",
            appointment_id: result.insertId
        });

    } catch (err) {
        console.error("Add Appointment Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
