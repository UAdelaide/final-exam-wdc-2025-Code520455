const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// 🛠️ Session middleware (ADD THIS)
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Only true if using HTTPS
    sameSite: 'lax'
  }
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes');

app.use('/api/dogs', dogRoutes);
app.use('/', userRoutes);
app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
