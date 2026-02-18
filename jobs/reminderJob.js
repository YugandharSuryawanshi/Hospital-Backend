const cron = require("node-cron");
const pool = require("../config/db");

cron.schedule("0 9 * * *", async () => {
    console.log("Running Reminder Job");

    const [rows] = await pool.execute(`
        SELECT u.mobile, a.appointment_date
        FROM appointments a
        JOIN users u ON u.user_id = a.user_id
        WHERE a.appointment_date = CURDATE() + INTERVAL 1 DAY
        AND a.status = 'approved'
    `);

    rows.forEach(user => {
        console.log("Send SMS to:", user.mobile);
        // integrate SMS API here
    });
});
