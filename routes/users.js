const express = require('express');
const db = require('../config/database');
const router = express.Router();

// Get all users
router.get('/all', async (req, res) => {
  try {
    const query = 'SELECT * FROM users WHERE is_verified = TRUE';
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('[USERS GET ALL] error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get pending users
router.get('/pending', async (req, res) => {
  try {
    const query = 'SELECT * FROM users WHERE is_verified = FALSE';
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('[USERS GET PENDING] error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/users/:studentId
router.get('/:studentId', async (req, res) => {
  const { studentId } = req.params;
  console.log('[USER GET] studentId=', studentId);
  if (!studentId) return res.status(400).json({ error: 'Student ID required' });

  try {
    const query = 'SELECT * FROM users WHERE student_id = ? AND is_verified = TRUE';
    const [results] = await db.query(query, [studentId]);
    if (!results || results.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = results[0];
    res.json({
      email: user.email,
      student_id: user.student_id,
      full_name: user.full_name,
      dob: user.dob,
      course: user.course || 'Computer Science',
      year: user.year || '3rd Year',
      cgpa: user.cgpa || 8.75,
      attendance: user.attendance || '92%'
    });
  } catch (err) {
    console.error('[USER GET] error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Quick existence check - GET /api/users/check/:studentId
router.get('/check/:studentId', async (req, res) => {
  const { studentId } = req.params;
  if (!studentId) return res.status(400).json({ error: 'Student ID required' });
  try {
    const query = 'SELECT 1 FROM users WHERE student_id = ? AND is_verified = TRUE LIMIT 1';
    const [rows] = await db.query(query, [studentId]);
    if (!rows || rows.length === 0) return res.status(404).json({ exists: false });
    return res.json({ exists: true });
  } catch (err) {
    console.error('[USER CHECK] error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

  module.exports = router;

  // Delete user by id - DELETE /api/users/:id
  // This route deletes a user row by numeric `id` field. It returns 200 and a JSON
  // message when deletion succeeds, or a 404 if no such row exists.
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const sql = 'DELETE FROM users WHERE id = ?';
      const [result] = await db.query(sql, [id]);
      if (result.affectedRows && result.affectedRows > 0) {
        return res.json({ success: true, deletedId: id });
      }
      return res.status(404).json({ error: 'User not found' });
    } catch (err) {
      console.error('[USER DELETE] error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  });
