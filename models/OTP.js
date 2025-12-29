const db = require('../config/database');

class OTP {
  static create(email, otp, expiresAt, callback) {
    // First delete any existing OTP for this email
    const deleteQuery = 'DELETE FROM otps WHERE email = ?';
    
    db.query(deleteQuery, [email], (err) => {
      if (err) return callback(err);
      
      // Insert new OTP
      const insertQuery = 'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)';
      db.query(insertQuery, [email, otp, expiresAt], callback);
    });
  }

  static findValidOTP(email, otp, callback) {
    const query = 'SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW()';
    db.query(query, [email, otp], callback);
  }

  static deleteOTP(email, callback) {
    const query = 'DELETE FROM otps WHERE email = ?';
    db.query(query, [email], callback);
  }
}

module.exports = OTP;