const pool = require("../config/db");

const sendNotification = async ({
    receiver_id,
    receiver_role,
    message,
    type = null,
    related_id = null
}) => {

    //Save notification in database
    const [result] = await pool.execute(`INSERT INTO notifications (receiver_id, receiver_role, message, type, related_id)
        VALUES (?, ?, ?, ?, ?)`, [receiver_id, receiver_role, message, type, related_id]);

    const notification = {
        notification_id: result.insertId,
        receiver_id,
        receiver_role,
        message,
        type,
        related_id,
        is_read: false
    };

    //Emit real-time if online
    if (receiver_role === "admin") {
        global.io.to("admin_room").emit("new-notification", notification);
    }

    if (receiver_role === "doctor") {
        global.io.to(`doctor_${receiver_id}`).emit("new-notification", notification);
    }

    if (receiver_role === "user") {
        global.io.to(`user_${receiver_id}`).emit("new-notification", notification);
    }
};

module.exports = { sendNotification };