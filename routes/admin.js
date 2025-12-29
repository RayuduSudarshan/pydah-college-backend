const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const router = express.Router();

// Admin login route
router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;
  console.log('[ADMIN LOGIN] incoming request', { username });
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Use promise-based query (db is a promise pool)
    const [results] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
    if (!results || results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const admin = results[0];
    // Compare password (plain for demo, use bcrypt.compare in production if passwords are hashed)
    if (password === admin.password) {
      return res.json({ success: true, admin: { username: admin.username } });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get all admins
router.get('/all', async (req, res) => {
  try {
    const [results] = await db.query('SELECT username FROM admin');
    return res.json(results);
  } catch (err) {
    console.error('Error fetching all admins:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
