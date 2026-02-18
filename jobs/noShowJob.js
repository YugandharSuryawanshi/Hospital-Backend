const cron = require("node-cron");
const pool = require("../config/db");

// Every day at 11:59 PM
cron.schedule("59 23 * * *", async () => {
    try {
        console.log("Running No Show Job...");

        await pool.execute(`UPDATE appointments SET status = 'no_show'
            WHERE appointment_date < CURDATE() AND status = 'approved'`);
        console.log("No Show Updated");
    } catch (err) {
        console.log("No Show Error:", err);
    }
});
