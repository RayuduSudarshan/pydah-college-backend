const User = require('../models/User');
const OTPModel = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const { sendOTPEmail } = require('../utils/emailService');

exports.register = (req, res) => {
  console.log('Received /register request for email:', req.body && req.body.email);
  const { full_name, email, student_id, dob, password, confirm_password } = req.body;

  // Basic validation
  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // Student ID validation: exactly 10 chars, only uppercase letters and digits, must contain at least one letter and one digit
  if (typeof student_id !== 'string' || !/^(?=.{10}$)(?=.*[A-Z])(?=.*\d)[A-Z0-9]{10}$/.test(student_id)) {
    return res.status(400).json({ error: 'Invalid student_id. It must be exactly 10 characters long, contain only UPPERCASE letters and digits, and include at least one letter and one number.' });
  }



  // Check if any user (verified or not) already exists with this email
  User.findByEmail(email, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    // Check if pending registration exists
    const db = require('../config/database');
    db.query('SELECT * FROM pending_users WHERE email = ?', [email], (err, pending) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (pending.length > 0) {
        return res.status(400).json({ error: 'Registration already pending for this email. Please verify OTP.' });
      }
      // Hash password and store in pending_users with OTP
      const bcrypt = require('bcryptjs');
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Failed to hash password' });
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        db.query(
          'INSERT INTO pending_users (full_name, email, student_id, dob, password, otp, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [full_name, email, student_id, dob, hashedPassword, otp, expiresAt],
          (err) => {
            if (err) return res.status(500).json({ error: 'Failed to create pending registration' });
            // Respond immediately so the client isn't blocked by email sending
            // In development (non-production) include the OTP in the response to aid testing when email isn't configured
            const payload = { message: 'Registration successful. OTP sent to email.', email };
            if (process.env.NODE_ENV !== 'production') payload.otp = otp;
            console.log(`Pending registration created for ${email}. OTP: ${otp} (expires at ${expiresAt.toISOString()})`);
            res.json(payload);

            // Send email asynchronously and log any errors
            sendOTPEmail(email, otp)
              .then(() => {
                console.log(`OTP email sent to ${email}`);
              })
              .catch(error => {
                // Log email error but do not fail the registration flow
                console.error('Email error (will not block registration):', error);
              });
          }
        );
      });
    });
  });
};

exports.verifyOTP = (req, res) => {
  const { email, otp } = req.body;
  console.log(`Received /verify-otp for ${email} with otp=${otp}`);
  const db = require('../config/database');
  // Find pending registration with matching OTP and not expired
  db.query(
    'SELECT * FROM pending_users WHERE email = ? AND otp = ? AND otp_expires_at > NOW()',
    [email, otp],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      // Move user to users table
      const user = results[0];
      db.query(
        'INSERT INTO users (full_name, email, student_id, dob, password, is_verified) VALUES (?, ?, ?, ?, ?, TRUE)',
        [user.full_name, user.email, user.student_id, user.dob, user.password],
        (err) => {
          if (err) return res.status(500).json({ error: 'Failed to create user' });
          // Delete from pending_users
          db.query('DELETE FROM pending_users WHERE email = ?', [email], (err) => {
            if (err) console.error('Error deleting pending registration:', err);
            console.log(`User ${email} verified and moved to users table.`);
            res.json({ message: 'OTP verified successfully' });
          });
        }
      );
    }
  );
};

exports.resendOTP = (req, res) => {
  const { email } = req.body;
  console.log(`Received /resend-otp for ${email}`);
  const db = require('../config/database');
  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  // Update OTP and expiry in pending_users
  db.query(
    'UPDATE pending_users SET otp = ?, otp_expires_at = ? WHERE email = ?',
    [otp, expiresAt, email],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update OTP' });
      }
      if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'No pending registration found for this email' });
      }
      sendOTPEmail(email, otp)
        .then(() => {
            const payload = { message: 'New OTP sent to email' };
            if (process.env.NODE_ENV !== 'production') payload.otp = otp;
            console.log(`Resent OTP for ${email}: ${otp} (expires at ${expiresAt.toISOString()})`);
            res.json(payload);
        })
        .catch(error => {
          console.error('Email error:', error);
          res.status(500).json({ error: 'Failed to send OTP email' });
        });
    }
  );
};

// Add this new endpoint for deleting unverified registrations
exports.deleteUnverified = (req, res) => {
  const { email } = req.body;
  
  User.deleteUnverifiedByEmail(email, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete unverified registration' });
    }
    
    res.json({ message: 'Unverified registration deleted' });
  });
};