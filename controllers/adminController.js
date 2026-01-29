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
        const { dr_name, dr_certificate, dr_position, dr_speciality, dr_contact, dr_email, dr_address, dr_gender, dr_experience, department_id, dr_fee, dr_about, dr_status } = req.body;
        const dr_photo = req.file ? req.file.filename : null;

        const [rows] = await pool.execute(
            `INSERT INTO doctors (dr_name, dr_certificate, dr_position, dr_speciality, dr_contact, dr_email, dr_photo, dr_address, dr_gender, dr_experience, department_id, dr_fee, dr_about, dr_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [dr_name, dr_certificate, dr_position, dr_speciality, dr_contact, dr_email, dr_photo, dr_address, dr_gender, dr_experience, department_id, dr_fee, dr_about, dr_status]
        );
        res.json({ message: "Doctor added successfully", doctor_id: rows.insertId });
    } catch (err) {
        console.error("addDoctor error", err);
        res.status(500).json({ error: err.message });
    }
};

// Edit Doctor
exports.updateDoctor = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { dr_name, dr_gender, dr_certificate, dr_position, dr_speciality, dr_contact, dr_email, dr_address, dr_experience, department_id, dr_fee, dr_about, dr_status } = req.body;
        const dr_photo = req.file ? req.file.filename : null;

        if (dr_photo === null) {
            await pool.execute(
                `UPDATE doctors SET dr_name = ?, dr_gender = ?, dr_certificate = ?, dr_position = ?, dr_experience = ?, dr_speciality = ?, department_id = ?, dr_contact = ?, dr_fee = ?, dr_email = ?, dr_address = ?, dr_about = ?, dr_status = ? WHERE doctor_id = ?`,
                [dr_name, dr_gender, dr_certificate, dr_position, dr_experience, dr_speciality, department_id, dr_contact, dr_fee, dr_email, dr_address, dr_about, dr_status, doctorId]
            );
            res.json({ message: "Doctor updated successfully" });

        }
        else {
            await pool.execute(
                `UPDATE doctors SET dr_name = ?, dr_gender = ?, dr_certificate = ?, dr_position = ?, dr_experience = ?, dr_speciality = ?, department_id = ?, dr_contact = ?, dr_fee = ?, dr_email = ?, dr_photo = ?, dr_address = ?, dr_about = ?, dr_status = ? WHERE doctor_id = ?`,
                [dr_name, dr_gender, dr_certificate, dr_position, dr_experience, dr_speciality, department_id, dr_contact, dr_fee, dr_email, dr_photo, dr_address, dr_about, dr_status, doctorId]
            );
            res.json({ message: "Doctor updated successfully" });
        }
    } catch (err) {
        console.error("Update doctor error", err);
        res.status(500).json({ error: err.message });
    }
}

// Get all doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const [rows] = await pool.execute(`SELECT d.doctor_id, d.dr_name, d.dr_speciality, d.dr_position, d.dr_contact, d.dr_email,
    d.dr_gender, d.dr_experience, d.dr_fee, d.dr_photo, d.dr_status, d.dr_certificate, d.dr_address, d.dr_about, dept.department_name
    FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.department_id ORDER BY d.doctor_id DESC`);
        res.json(rows);
    } catch (err) {
        console.error("getAllDoctors error", err);
        res.status(500).json({ error: err.message });
    }
};

// Delete Doctor
exports.deleteDoctor = async (req, res) => {
    try {
        const doctorId = req.params.id;
        await pool.execute("DELETE FROM doctors WHERE doctor_id = ?", [doctorId]);
        res.json({ message: "Doctor deleted successfully" });
    } catch (err) {
        console.error("deleteDoctor error", err);
        res.status(500).json({ error: err.message });
    }
}

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

// Add Facility
exports.addFacility = async (req, res) => {
    const { facility_name, facility_desc } = req.body;
    const facility_image = req.file ? req.file.filename : null;

    try {
        const [rows] = await pool.execute(`INSERT INTO facilities (facility_name, facility_desc, facility_image) VALUES (?, ?, ?)`,
            [facility_name, facility_desc, facility_image]
        );
        res.json({ message: "Facility added successfully", facility_id: rows.insertId });
    } catch (err) {
        console.error("addFacility error", err);
        res.status(500).json({ error: err.message });
    }
}

// Get all facilities
exports.getAllFacilities = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM facilities");
        res.json(rows);
    } catch (err) {
        console.error("getFacilities error", err);
        res.status(500).json({ error: err.message });
    }
}

// Delete facility
exports.deleteFacility = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute("DELETE FROM facilities WHERE facility_id = ?", [id]);
        res.json({ message: "Facility deleted successfully" });
    } catch (err) {
        console.error("deleteFacility error", err);
        res.status(500).json({ error: err.message });
    }
}

// Update Facility
exports.updateFacility = async (req, res) => {
    try {
        const { id } = req.params;
        const { facility_name, facility_desc } = req.body;
        const facility_image = req.file ? req.file.filename : null;

        await pool.execute(`UPDATE facilities SET facility_name = ?, facility_desc = ?, facility_image = ? WHERE facility_id = ?`,
            [facility_name, facility_desc, facility_image, id]
        );
        res.json({ message: "Facility updated successfully" });
    } catch (err) {
        console.error("updateFacility error", err);
        res.status(500).json({ error: err.message });
    }
}

// Get all users for dashboard
exports.getUsers = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM users WHERE role = 'user'");
        res.status(200).json(rows);
    } catch (err) {
        console.error("❌ getAllUsers error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get User By ID
exports.getUserById = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM users WHERE user_id=?", [req.params.id]);
        res.json(rows[0]);

    } catch (err) {
        console.error("getUsers error", err);
        res.status(500).json({ error: err.message });
    }
}

// Update Patient By Admin
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const { user_name, user_email, user_phone, user_address, user_age, user_gender, } = req.body;

        await pool.execute(`UPDATE users SET user_name = ?, user_email = ?, user_phone = ?, user_address = ?, user_age = ?,
            user_gender = ? WHERE user_id = ?`, [user_name, user_email, user_phone, user_address, user_age, user_gender, id,]);

        res.status(200).json({ success: true, message: "Patient updated successfully" });
    } catch (err) {
        console.error("updatePatient error", err);
        res.status(500).json({ error: err.message });
    }
};

// Delete Patient
exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute("DELETE FROM users WHERE user_id = ?", [id]);
        res.json({ message: "Patient deleted successfully" });
    } catch (err) {
        console.error("deletePatient error", err);
        res.status(500).json({ error: err.message });
    }
};

// Add New Department
exports.addDepartment = async (req, res) => {
    const { department_name, department_desc } = req.body;

    try {
        const [rows] = await pool.execute(`INSERT INTO departments (department_name, department_description) VALUES (?, ?)`,
            [department_name, department_desc]
        );
        res.json({ message: "Department added successfully", department_id: rows.insertId });
    } catch (err) {
        console.error("addDepartment error", err);
        res.status(500).json({ error: err.message });
    }
}

// Get All Departments
exports.getDepartments = async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM departments");
        res.json(rows);
    } catch (err) {
        console.error("getDepartments error", err);
        res.status(500).json({ error: err.message });
    }
}

// Update Department
exports.updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { department_name, department_desc, department_status } = req.body;
        await pool.execute(`UPDATE departments SET department_name = ?, department_description = ?, department_status = ? WHERE department_id = ?`,
            [department_name, department_desc, department_status, id]
        );
        res.json({ message: "Department updated successfully" });
    } catch (err) {
        console.error("updateDepartment error", err);
        res.status(500).json({ error: err.message });
    }
}

// Delete Department
exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute("DELETE FROM departments WHERE department_id = ?", [id]);
        res.json({ message: "Department deleted successfully" });
    } catch (err) {
        console.error("deleteDepartment error", err);
        res.status(500).json({ error: err.message });
    }
}















// Delete slide
// Some working are pending.
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