const AcademicInfo = require('../models/AcademicInfo');

exports.updateAcademicInfo = async (req, res) => {
  const { student_id, course, year, semester, cgpa, attendance, backlogs, remark } = req.body;
  console.log('Received student_id:', student_id);
  console.log('Received data:', { course, year, semester, cgpa, attendance, backlogs, remark });
  if (!student_id) return res.status(400).json({ error: 'Student ID required' });
  const data = { course, year, semester, cgpa, attendance, backlogs, remark };

  try {
    // Verify student exists in users table
    const User = require('../models/User');
    const userRows = await User.getByStudentId(student_id);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const results = await AcademicInfo.getByStudentId(student_id);
    console.log('Query results:', results);
    if (!results || results.length === 0) {
      // Insert new academic info
      await AcademicInfo.insert(student_id, data);
      return res.json({ message: 'Academic info created' });
    } else {
      // Update existing academic info
      await AcademicInfo.updateByStudentId(student_id, data);
      return res.json({ message: 'Academic info updated' });
    }
  } catch (err) {
    console.error('Academic info update error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};
