const db = require('../config/database');

const AcademicInfo = {
  async getByStudentId(studentId) {
    try {
      const sql = 'SELECT * FROM academic_info WHERE student_id = ?';
      const [rows] = await db.query(sql, [studentId]);
      return rows;
    } catch (error) {
      console.error('Error in getByStudentId:', error);
      throw error;
    }
  },

  async getAll() {
    try {
      const sql = 'SELECT * FROM academic_info';
      const [rows] = await db.query(sql);
      return rows;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  },

  async updateByStudentId(studentId, data) {
    try {
      const sql = `
        UPDATE academic_info 
        SET course = ?, 
            year = ?, 
            semester = ?, 
            cgpa = ?, 
            attendance = ?, 
            backlogs = ?, 
            remark = ? 
        WHERE student_id = ?`;
      
      const params = [
        data.course,
        data.year,
        data.semester,
        parseFloat(data.cgpa),
        parseFloat(data.attendance),
        parseInt(data.backlogs),
        data.remark,
        studentId
      ];

      const [result] = await db.query(sql, params);
      return result;
    } catch (error) {
      console.error('Error in updateByStudentId:', error);
      throw error;
    }
  },

  async insert(studentId, data) {
    try {
      const sql = `
        INSERT INTO academic_info (
          student_id, course, year, semester, 
          cgpa, attendance, backlogs, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
        studentId,
        data.course,
        data.year,
        data.semester,
        parseFloat(data.cgpa),
        parseFloat(data.attendance),
        parseInt(data.backlogs),
        data.remark
      ];

      const [result] = await db.query(sql, params);
      return result;
    } catch (error) {
      console.error('Error in insert:', error);
      throw error;
    }
  }
};

module.exports = AcademicInfo;
