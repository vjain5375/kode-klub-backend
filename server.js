const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const quizRoutes = require('./routes/quiz');
require('dotenv').config();



const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/quiz', quizRoutes);


app.get('/', (req, res) => {
  res.send('WebXplore Backend Running');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Mongo Error:', err.message));


app.listen(4000, () => {
  console.log('Server running on port 4000');
});
