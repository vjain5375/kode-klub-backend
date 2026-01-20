require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
const passport = require('./config/passport');



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
  res.send('WebXplore Backend Running');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Mongo Error:', err.message));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
