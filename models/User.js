const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static create(userData, callback) {
    const { full_name, email, student_id, dob, password } = userData;
    
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return callback(err);
      
      const query = `
        INSERT INTO users (full_name, email, student_id, dob, password, is_verified) 
        VALUES (?, ?, ?, ?, ?, FALSE)
      `;
      
      db.query(query, [full_name, email, student_id, dob, hashedPassword], callback);
    });
  }

  static findByEmail(email, callback) {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], callback);
  }

  static findVerifiedByEmail(email, callback) {
    const query = 'SELECT * FROM users WHERE email = ? AND is_verified = TRUE';
    db.query(query, [email], callback);
  }

  static verifyUser(email, callback) {
    const query = 'UPDATE users SET is_verified = TRUE WHERE email = ?';
    db.query(query, [email], callback);
  }

  static deleteUnverifiedByEmail(email, callback) {
    const query = 'DELETE FROM users WHERE email = ? AND is_verified = FALSE';
    db.query(query, [email], callback);
  }
}

// Promise-based helper to get user by student_id
User.getByStudentId = async function(studentId) {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE student_id = ?', [studentId]);
    return rows;
  } catch (err) {
    console.error('Error in User.getByStudentId:', err);
    throw err;
  }
};

module.exports = User;