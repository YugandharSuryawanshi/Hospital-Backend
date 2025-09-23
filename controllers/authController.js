// controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body || {};
        const userName = name || req.body.user_name;
        const userEmail = email || req.body.user_email;
        const userPassword = password || req.body.user_password;
        const userRole = role || req.body.role;

        if (!userName || !userEmail || !userPassword) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        // check user are exist or not
        const [exists] = await pool.execute('SELECT user_id FROM users WHERE user_email = ?', [userEmail]);
        if (exists.length) return res.status(409).json({ message: 'Email already registered' });

        const hashed = await bcrypt.hash(userPassword, 10);
        const imagePath = req.file ? `uploads/${req.file.filename}` : null;

        const [result] = await pool.execute(
            'INSERT INTO users (user_name, user_email, user_password, user_profile, role) VALUES (?, ?, ?, ?, ?)',
            [userName, userEmail, hashed, imagePath, role || 'user']
        );

        const insertId = result.insertId;
        const [rows] = await pool.execute(
            'SELECT user_id, user_name, user_email, user_profile, role, created_at FROM users WHERE user_id = ?',
            [insertId]
        );

        res.status(201).json({ message: 'User registered', user: rows[0] });
    } catch (err) {
        console.error('register error', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const userEmail = email || req.body.user_email;
        const userPassword = password || req.body.user_password;

        if (!userEmail || !userPassword) return res.status(400).json({ message: 'Email and password required' });

        const [rows] = await pool.execute(
            'SELECT user_id, user_name, user_email, user_password, user_profile, role FROM users WHERE user_email = ?',
            [userEmail]
        );
        if (!rows.length) return res.status(400).json({ message: 'Invalid credentials' });

        const user = rows[0];
        const ok = await bcrypt.compare(userPassword, user.user_password);
        if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

        const payload = { id: user.user_id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                user_profile: user.user_profile,
                role: user.role
            }
        });
    } catch (err) {
        console.error('login error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// optional endpoint to verify token and return user data
exports.me = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const [rows] = await pool.execute(
            'SELECT user_id, user_name, user_email, user_profile, role, created_at FROM users WHERE user_id = ?',
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ message: 'User not found' });
        res.json({ user: rows[0] });
    } catch (err) {
        console.error('me error', err);
        res.status(500).json({ message: 'Server error' });
    }
};
