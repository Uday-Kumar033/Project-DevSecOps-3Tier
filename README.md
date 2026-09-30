# 3-Tier DevSecOps Project

This repository contains a simple Node.js API and a React client used for a user management demo. Follow the steps below to get the project running locally.

## Setup

1. Install Node.js (version 18 or later is recommended).
2. Install dependencies for both the API and client:

   ```bash
   cd api && npm install
   cd ../client && npm install
   ```

3. Start the API server:

   ```bash
   cd api
   npm start
   ```

4. In a separate terminal, start the React client:

   ```bash
   cd client
   npm start
   ```

5. Open `http://localhost:3000` in your browser to use the application.







# MySQL Setup on Linux

This guide explains how to install MySQL Server on Linux, configure the MySQL `root` user, create a database, and create a `users` table for a CRUD application.

## Prerequisites

- Ubuntu/Debian-based Linux system
- `sudo` privileges
- Internet connection

## 1. Install MySQL Server

Update the package index and install MySQL Server:

```bash
sudo apt update
sudo apt install mysql-server -y
```

Check that MySQL is running:

```bash
sudo systemctl status mysql
```

If it is not running, start it with:

```bash
sudo systemctl start mysql
```

Enable MySQL to start automatically after reboot:

```bash
sudo systemctl enable mysql
```

## 2. Log in to MySQL

Open the MySQL shell:

```bash
sudo mysql -u root -p
```

Enter your MySQL root password when prompted.

> **Note:** On some Ubuntu installations, the root account uses socket authentication and may not require a password when accessed with `sudo mysql`. If you configure a password for the root account, use the authentication method appropriate for your MySQL version.

## 3. Set the Root Password

Inside the MySQL shell, run:

```sql
ALTER USER 'root'@'localhost'
IDENTIFIED WITH mysql_native_password BY 'Uday';

FLUSH PRIVILEGES;
```

Then exit:

```sql
EXIT;
```

### Security Note

Do not use a simple password such as `Aditya` in a production environment. Use a strong, unique password and never commit credentials to GitHub.

For an application, it is better to create a separate MySQL user instead of using `root`.

## 4. Create the Database

Log in again:

```bash
sudo mysql -u root -p
```

Create the database:

```sql
CREATE DATABASE IF NOT EXISTS crud_app;
```

Verify that it was created:

```sql
SHOW DATABASES;
```

## 5. Select the Database

Switch to the `crud_app` database:

```sql
USE crud_app;
```

You can verify the currently selected database with:

```sql
SELECT DATABASE();
```

## 6. Create the `users` Table

If you want to remove an existing `users` table first, run:

```sql
DROP TABLE IF EXISTS users;
```

> **Warning:** `DROP TABLE` permanently removes the table and its data.

Now create the table:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'viewer') NOT NULL DEFAULT 'viewer',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 7. Verify the Table

Show all tables:

```sql
SHOW TABLES;
```

Check the table structure:

```sql
DESCRIBE users;
```

You should see columns similar to:

| Column | Type | Description |
|---|---|---|
| `id` | INT | Auto-incrementing primary key |
| `name` | VARCHAR(255) | User's name |
| `email` | VARCHAR(255) | Unique email address |
| `password` | VARCHAR(255) | Password value |
| `role` | ENUM | `admin` or `viewer` |
| `is_active` | TINYINT(1) | Account active/inactive status |
| `created_at` | TIMESTAMP | Account creation timestamp |

## 8. Test the Database

Insert a test user:

```sql
INSERT INTO users (name, email, password, role)
VALUES ('Test User', 'test@example.com', 'change-me', 'viewer');
```

Check the data:

```sql
SELECT * FROM users;
```

## 9. Useful MySQL Commands

### Show databases

```sql
SHOW DATABASES;
```

### Select database

```sql
USE crud_app;
```

### Show tables

```sql
SHOW TABLES;
```

### View table structure

```sql
DESCRIBE users;
```

### View users

```sql
SELECT * FROM users;
```

### Exit MySQL

```sql
EXIT;
```

## 10. Complete Setup

For a fresh setup, the main commands are:

```bash
sudo apt update
sudo apt install mysql-server -y
sudo mysql -u root -p
```

Then run:

```sql
ALTER USER 'root'@'localhost'
IDENTIFIED WITH mysql_native_password BY 'Aditya';

FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS crud_app;

USE crud_app;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'viewer') NOT NULL DEFAULT 'viewer',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Verify:

```sql
SHOW TABLES;
DESCRIBE users;
```

