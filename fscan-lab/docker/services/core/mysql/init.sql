CREATE DATABASE IF NOT EXISTS secrets;
USE secrets;

CREATE TABLE IF NOT EXISTS flags (
    id INT PRIMARY KEY,
    flag VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS credentials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service VARCHAR(50),
    username VARCHAR(100),
    password VARCHAR(100),
    notes TEXT
);

INSERT INTO flags (id, flag, description) VALUES
(1, 'FSCAN_LAB{mysql_d4t4b4s3_pwn3d}', 'Flag 6 - MySQL Database'),
(2, 'Hint: LDAP admin credentials are admin:LdapAdmin2024', 'LDAP Hint');

INSERT INTO credentials (service, username, password, notes) VALUES
('ldap', 'admin', 'LdapAdmin2024', 'Domain controller admin account'),
('mongodb', 'admin', 'mongo123', 'MongoDB root password'),
('backup', 'backup_user', 'Backup@2024', 'Backup system credentials');
