const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pydah_college'
});

// Test the connection
connection.connect((err) => {
  if (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
  console.log('Successfully connected to database');

  // Test if table exists
  connection.query('SHOW TABLES LIKE "academic_info"', (err, results) => {
    if (err) {
      console.error('Error checking table:', err);
      process.exit(1);
    }
    
    if (results.length === 0) {
      console.log('Table academic_info does not exist. Creating it...');
      // Create the table
      const createTable = `
        CREATE TABLE academic_info (
          id int primary key auto_increment,
          student_id varchar(50) not null unique,
          course varchar(100) not null,
          year varchar(20) not null,
          semester varchar(20) not null,
          cgpa decimal(4,2) default 0.00,
          attendance decimal(5,2) default 0.00,
          backlogs int default 0,
          remark text,
          created_at timestamp default current_timestamp,
          updated_at timestamp default current_timestamp on update current_timestamp
        )`;
      
      connection.query(createTable, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          process.exit(1);
        }
        console.log('Table academic_info created successfully');
        process.exit(0);
      });
    } else {
      console.log('Table academic_info exists');
      process.exit(0);
    }
  });
});