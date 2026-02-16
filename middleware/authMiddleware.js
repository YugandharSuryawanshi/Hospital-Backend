const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify token
const verifyToken = (req, res, next) => {
    const header = req.headers.authorization || req.headers.Authorization;

    if (!header || !header.startsWith('Bearer '))
        return res.status(401).json({ message: 'No token provided' });

    const token = header.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined')
        return res.status(401).json({ message: 'Token missing' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Is admin
const isAdmin = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });

    if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Admins only' });

    next();
};

// Is user
const isUser = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });

    if (req.user.role !== 'user')
        return res.status(403).json({ message: 'Users only' });

    next();
};

// Is doctor
const isDoctor = (req, res, next) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });

    if (req.user.role !== 'doctor')
        return res.status(403).json({ message: 'Doctors only' });

    next();
};

module.exports = { verifyToken, isAdmin, isUser, isDoctor };
