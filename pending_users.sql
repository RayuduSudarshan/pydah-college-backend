-- Table for pending (unverified) user registrations
CREATE TABLE IF NOT EXISTS pending_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  student_id VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  password VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  otp_expires_at DATETIME NOT NULL
);

-- Remove any old pending_users table if needed
-- DROP TABLE IF EXISTS pending_users;
