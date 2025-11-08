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
        // Expecting JSON body: doctor_id, user_name, user_contact, user_email, appointment_datetime, notes
        const { doctor_id, user_name, user_contact, user_email, appointment_datetime, notes } = req.body;

        console.log("raw body:", req.body);

        // basic validation
        if (!user_name || !user_contact || !appointment_datetime) {
            return res.status(400).json({ error: "user_name, user_contact and appointment_datetime are required" });
        }

        // normalize doctor id
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

        // return Get created appointment
        const insertId = result.insertId;
        const [rows] = await pool.execute("SELECT * FROM appointments WHERE appointment_id = ?", [insertId]);

        return res.status(201).json({ appointment: rows[0] });
    } catch (err) {
        console.error("addAppointment error", err);
        return res.status(500).json({ error: err.message || "Server error" });
    }
};