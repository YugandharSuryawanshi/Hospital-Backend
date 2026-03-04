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
        AND is_read=FALSE`,[userId]);
    res.json({ count: row.count });
}

exports.markNotificationAsRead = async (req, res) => {
    const userId = req.user.id;
    await pool.execute(`UPDATE notifications SET is_read = true WHERE receiver_role='doctor' AND receiver_id=?`, [userId]);
    res.json({ message: "Marked as read" });
}