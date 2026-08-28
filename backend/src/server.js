require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes       = require('./routes/auth');
const enrollRoutes     = require('./routes/enroll');
const sessionsRoutes   = require('./routes/sessions');
const attendanceRoutes = require('./routes/attendance');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/auth',       authRoutes);
app.use('/api/enroll',     enrollRoutes);
app.use('/api/sessions',   sessionsRoutes);
app.use('/api/attendance', attendanceRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Sandstone 6.0 backend running on port ${PORT}`);
});

module.exports = app;
