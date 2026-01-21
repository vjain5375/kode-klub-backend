require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
const passport = require('./config/passport');

// For self-ping to keep server alive
const https = require('https');
const http = require('http');

const app = express();
const attemptRoutes = require('./routes/attempt');
const leaderboardRoutes = require('./routes/leaderboard');
const authRoutes = require('./routes/auth');
const dppRoutes = require('./routes/dpp');

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
app.use('/api/quiz', quizRoutes);
app.use('/api/attempt', attemptRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dpp', dppRoutes);
app.use('/api/admin', require('./routes/admin'));

// Track visits
app.use(require('./middleware/visitorTracking'));


app.get('/', (req, res) => {
  res.send('Kode Club Backend Running');
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Keep-alive ping function to prevent Render free tier spindown
const keepAlive = () => {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

  // Only ping if we have a proper production URL (not localhost)
  if (backendUrl.includes('localhost')) {
    console.log('[Keep-Alive] Running locally, skipping self-ping');
    return;
  }

  const protocol = backendUrl.startsWith('https') ? https : http;

  protocol.get(`${backendUrl}/health`, (res) => {
    console.log(`[Keep-Alive] Ping successful at ${new Date().toISOString()} - Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[Keep-Alive] Ping failed:`, err.message);
  });
};

// Ping every 14 minutes (before Render's 15-minute timeout)
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    // Start keep-alive pings after successful DB connection
    setInterval(keepAlive, KEEP_ALIVE_INTERVAL);
    console.log(`[Keep-Alive] Started - pinging every 14 minutes`);
  })
  .catch(err => console.log('Mongo Error:', err.message));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
