// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const pool = require('./config/db');

// const app = express();

// app.use(express.json());
// app.use(cors({ origin: 'http://localhost:5000' || 'http://localhost:5173', credentials: true }));

// app.use(express.urlencoded({ extended: true }));

// // serve uploads folder
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // DB test at startup is On Or Not
// (async () => {
//     try {
//         const conn = await pool.getConnection();
//         console.log("MySQL Connected Successfully");
//         conn.release();
//     } catch (err) {
//         console.error("MySQL Connection Failed:", err.message);
//     }
// })();

// // routes
// const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const authRoutes = require('./routes/authRoutes');
// app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);
// app.use('/api/admin', adminRoutes);

// app.get('/', (req, res) => res.json({ msg: 'Backend running' }));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));






















require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

const app = express();

/* ========= MIDDLEWARE ========= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

/* ========= STATIC ========= */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ========= TEST ROUTE ========= */
app.get('/', (req, res) => {
  res.send('BACKEND IS RUNNING');
});

/* ========= DB CHECK ========= */
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Connected');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL Error:', err.message);
  }
})();

/* ========= ROUTES ========= */
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

/* ========= START ========= */
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
