const pool = require("../config/db");

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.execute(
            "SELECT user_id, user_name, user_email, user_profile, role FROM users ORDER BY user_id DESC"
        );
        res.json(users);
    } catch (err) {
        console.error("getAllUsers error", err);
        res.status(500).json({ error: err.message });
    }
};

// Update user profile
exports.updateUser = async (req, res) => {
    try {
        const userId = req.body.id || req.body.user_id;
        const name = req.body.name;
        const email = req.body.email;

        if (req.file) {
            // update including new image
            await pool.execute(
                "UPDATE users SET user_name = ?, user_email = ?, user_profile = ? WHERE user_id = ?",
                [name, email, req.file.filename, userId]
            );
        } else {
            // update without image
            await pool.execute(
                "UPDATE users SET user_name = ?, user_email = ? WHERE user_id = ?",
                [name, email, userId]
            );
        }

        const [rows] = await pool.execute(
            "SELECT user_id, user_name, user_email, user_profile, role FROM users WHERE user_id = ?",
            [userId]
        );

        res.json({ message: "Profile updated", user: rows[0] });
    } catch (err) {
        console.error("updateUser error", err);
        res.status(500).json({ error: err.message });
    }
};

// Add a slide
exports.addSlides = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // store only the filename
        const filename = req.file.filename;
        await pool.execute("INSERT INTO slides (slide_image) VALUES (?)", [filename]);

        res.json({ message: "Slide added successfully", slide_image: filename });
    } catch (err) {
        console.error("addSlides error", err);
        res.status(500).json({ error: err.message });
    }
};

// Get slides list
exports.getSlides = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM slides");
        res.json(rows);
    } catch (err) {
        console.error("getSlides error", err);
        res.status(500).json({ error: err.message });
    }
};

// Add doctor
exports.addDoctor = async (req, res) => {
    try {
        const { dr_name, dr_certificate, dr_position, dr_speciality, dr_contact, dr_email, dr_address } = req.body;
        const dr_photo = req.file ? req.file.filename : null;

        const [rows] = await pool.execute(
            `INSERT INTO doctors (dr_name, dr_certificate, dr_position, dr_speciality, dr_contact, dr_email, dr_photo, dr_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [dr_name, dr_certificate, dr_position, dr_speciality, dr_contact, dr_email, dr_photo, dr_address]
        );
        res.json({ message: "Doctor added successfully", doctor_id: rows.insertId });
    } catch (err) {
        console.error("addDoctor error", err);
        res.status(500).json({ error: err.message });
    }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM doctors");
        res.json(rows);
    } catch (err) {
        console.error("getAllDoctors error", err);
        res.status(500).json({ error: err.message });
    }
};

// Get all appointments
exports.getAllAppointments = async (req, res) => {
    try {
        const [rows] = await pool.execute(`SELECT a.appointment_id, a.user_name, a.user_contact, a.user_email, a.appointment_datetime,
        a.notes, a.status, a.doctor_id, d.doctor_id, d.dr_name, d.dr_position, d.dr_certificate, d.dr_photo FROM appointments AS a JOIN 
        doctors AS d ON a.doctor_id = d.doctor_id ORDER BY a.appointment_id DESC`);
        res.json(rows);
    } catch (err) {
        console.error("getAllAppointments error", err);
        res.status(500).json({ error: err.message });
    }
};

















// Delete slide
exports.deleteSlide = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute("DELETE FROM slides WHERE slide_id = ?", [id]);
        res.json({ message: "Slide deleted successfully" });
    } catch (err) {
        console.error("deleteSlide error", err);
        res.status(500).json({ error: err.message });
    }
};
