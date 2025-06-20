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

// Login button

router.post('/login',async(req, res) => {

try{
  const { username, password } = req.body;
  const[data] = await db.query(`
    SELECT * FROM Users WHERE username =? AND password_hash=?
    `,[username,password]);

    if (data.length === 0){
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    // req.session.user = {
    //   id: data[0].user_id,
    //   username: data[0].username,
    //   role: data[0].role
    // };

    res.json({
      message: 'Login successfull',
      username: data[0].username,
      role: data[0].role
    });
} catch(error){
  res.status(500).json({error: 'Login failed' });
}
});

// logout button
router.post('/logout',(req,res) => {
  if(req.session){
    req.session.destroy(err =>{
      if(err){
        console.error
      }
    })
  }
})

module.exports = router;
