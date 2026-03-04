require("dotenv").config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'],
  credentials: true
}));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test Route
app.get('/', (req, res) => {
  res.send('BACKEND IS RUNNING...');
});

// Create Server with HTTP
const server = http.createServer(app);
// Create Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// make io global (used in controllers) for notification
global.io = io;
io.on("connection", (socket) => {

  // console.log("New client connected:", socket.id);

  //User joins
  socket.on("join-user", (userId) => {
    if (!userId) return;
    const room = `user_${userId}`;
    
    socket.join(room);
    console.log(`User joined room: user_${userId}`);
  });

  //Doctor joins
  socket.on("join-doctor", (doctorId) => {
    if (!doctorId) return;
    socket.join(`doctor_${doctorId}`);
    console.log(`Doctor joined room: doctor_${doctorId}`);
  });

  //Admin joins
  socket.on("join-admin", () => {
    socket.join("admin_room");
    console.log("Admin joined room: admin");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

});

// Connect to MySQL
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL Connected');
    conn.release();

    //Auto call function daily on time
    require("./jobs/noShowJob");
    // For sms reminder
    require("./jobs/reminderJob");
  } catch (err) {
    console.error('MySQL Error:', err.message);
  }
})();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use("/api/doctor", require("./routes/doctorRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server Running + Socket.IO running on http://localhost:${PORT}`);
});
