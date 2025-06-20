const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});


// POST login (dummy version)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, password }); // Log received credentials

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role, password_hash FROM Users // Select password_hash to inspect
      WHERE username = ?
    `, [username]);

    if (rows.length === 0) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    console.log('Found user:', { username: user.username, role: user.role, storedPasswordHash: user.password_hash });

    // IMPORTANT: Replace this with proper password comparison using a hashing library
    if (password === user.password_hash) { // This is the problematic line if not hashing
      req.session.user = {
        id: user.user_id,
        username: user.username,
        role: user.role
      };
      res.json({
        message: 'Login successful',
        username: user.username,
        role: user.role
      });
    } else {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed'});
  }
});

module.exports = router;
