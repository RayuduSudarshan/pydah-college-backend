-- Academic Information Table
CREATE TABLE IF NOT EXISTS academic_info (
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
);