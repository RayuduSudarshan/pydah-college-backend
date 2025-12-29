const express = require('express');
const router = express.Router();
const { updateAcademicInfo } = require('../controllers/academicController');

const AcademicInfo = require('../models/AcademicInfo');

router.post('/update', updateAcademicInfo);

// Get academic info by student ID
router.post('/get', async (req, res) => {
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ error: 'Student ID required' });
    try {
        const results = await AcademicInfo.getByStudentId(student_id);
        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'No academic info found' });
        }
        return res.json(results[0]);
    } catch (err) {
        console.error('Error fetching academic info:', err);
        return res.status(500).json({ error: 'Database error' });
    }
});

// Get all academic info
router.get('/all', async (req, res) => {
    try {
        const results = await AcademicInfo.getAll();
        return res.json(results);
    } catch (err) {
        console.error('Error fetching all academic info:', err);
        return res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
