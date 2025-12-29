-- Admin table for login
drop table if exists admin;
create table admin (
  id int primary key auto_increment,
  username varchar(100) not null unique,
  password varchar(100) not null
);

insert into admin (username, password) values ('admin@123', 'admin@123');

