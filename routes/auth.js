
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const bcrypt = require('bcryptjs');

// Make sure db is available in scope. If not, require it here:
const db = require('../config/database');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.delete('/delete-unverified', authController.deleteUnverified); // Add this line

// Add login route
router.post('/login', async (req, res) => {
  // Accept either email or student_id for login. Flutter sends 'email' field, which may contain a student id.
  let { email, student_id, password } = req.body;

  // If student_id is not explicitly provided, try to detect it from 'email' field (no '@' -> student id)
  if (!student_id && email && !email.includes('@')) {
    student_id = email;
    email = null;
  }

  // Build appropriate query depending on identifier
  let query;
  let params;
  if (student_id) {
    query = 'SELECT * FROM users WHERE student_id = ? AND is_verified = TRUE';
    params = [student_id];
  } else {
    query = 'SELECT * FROM users WHERE email = ? AND is_verified = TRUE';
    params = [email];
  }

  try {
    const [results] = await db.query(query, params);
    if (!results || results.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials or account not verified' });
    }
    const user = results[0];
    const isMatch = await new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, match) => {
        if (err) return reject(err);
        resolve(match);
      });
    });
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    // Login successful
    res.json({
      message: 'Login successful',
      user: {
        email: user.email,
        student_id: user.student_id,
        full_name: user.full_name,
        dob: user.dob,
        course: 'Computer Science', // You might want to store this in DB
        year: '3rd Year', // You might want to store this in DB
        cgpa: 8.75, // You might want to store this in DB
        attendance: '92%' // You might want to store this in DB
      },
      token: 'your-jwt-token' // Implement JWT if needed
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add check verified endpoint
router.post('/check-verified', (req, res) => {
	const { email } = req.body;
	const query = 'SELECT is_verified FROM users WHERE email = ?';
	db.query(query, [email], (err, results) => {
		if (err) {
			return res.status(500).json({ error: 'Database error' });
		}
		if (results.length === 0) {
			return res.status(404).json({ error: 'User not found' });
		}
		res.json({ is_verified: results[0].is_verified });
	});
});

module.exports = router;