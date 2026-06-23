-- MSSQL 初始化脚本
-- 创建 secrets 表并插入 flag10

USE master;
GO

CREATE TABLE dbo.secrets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    key_name NVARCHAR(255) NOT NULL,
    key_value NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 插入 flag10
INSERT INTO dbo.secrets (key_name, key_value) VALUES
    ('flag10', 'FSCAN_LAB{mssql_s4_4cc0unt_pwn3d}'),
    ('db_version', 'Microsoft SQL Server 2022'),
    ('admin_account', 'sa'),
    ('production_db', '10.10.3.31');
GO

-- 创建业务数据表
CREATE TABLE dbo.employees (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100),
    position NVARCHAR(100),
    salary DECIMAL(10,2)
);
GO

INSERT INTO dbo.employees (name, position, salary) VALUES
    ('David', 'Manager', 95000.00),
    ('Eve', 'Developer', 80000.00),
    ('Frank', 'Designer', 75000.00);
GO
