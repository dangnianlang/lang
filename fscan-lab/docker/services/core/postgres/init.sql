-- PostgreSQL 初始化脚本
-- 创建 secrets 表并插入 flag9

CREATE TABLE IF NOT EXISTS secrets (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入 flag9
INSERT INTO secrets (key, value) VALUES
    ('flag9', 'FSCAN_LAB{p0stgr3s_d4t4b4s3_pwn3d}'),
    ('db_type', 'PostgreSQL 15'),
    ('admin_email', 'dba@target.corp'),
    ('backup_server', '10.10.2.22');

-- 创建业务数据表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(255),
    department VARCHAR(100)
);

INSERT INTO users (username, email, department) VALUES
    ('alice', 'alice@target.corp', 'Engineering'),
    ('bob', 'bob@target.corp', 'Sales'),
    ('charlie', 'charlie@target.corp', 'HR');
