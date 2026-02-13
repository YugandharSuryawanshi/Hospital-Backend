require("dotenv").config();
// require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

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
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test Route
app.get('/', (req, res) => {
  res.send('BACKEND IS RUNNING');
});

// Create Server with HTTP
const server = http.createServer(app);

// Create Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// make io global (used in controllers)
global.io = io;
io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
  });
});

// Connect to MySQL
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL Connected');
    conn.release();
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
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server Running + Socket.IO running on http://localhost:${PORT}`);
});
