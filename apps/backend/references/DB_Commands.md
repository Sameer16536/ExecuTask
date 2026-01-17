# PostgreSQL Database Commands Reference

This document contains all the essential PostgreSQL commands for managing the ExecuTask database on Windows.

## Database Configuration

```plaintext
Host: localhost
Port: 5432
User: postgres
Password: admin
Database: executask
SSL Mode: disable
```

## Initial Setup Commands

### 1. Check PostgreSQL Service Status

```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start PostgreSQL service
Start-Service postgresql-x64-*

# Stop PostgreSQL service
Stop-Service postgresql-x64-*

# Restart PostgreSQL service
Restart-Service postgresql-x64-*
```

### 2. Navigate to PostgreSQL Bin Directory

```powershell
# Adjust version number as needed (e.g., 14, 15, 16)
cd "C:\Program Files\PostgreSQL\14\bin"
```

### 3. Connect to PostgreSQL

```powershell
# Connect as postgres user
psql -U postgres

# Connect with password prompt
psql -U postgres -W

# Connect to specific database
psql -U postgres -d executask

# Connect with all parameters
psql -h localhost -p 5432 -U postgres -d executask
```

## Database Management Commands

### Create Database

```sql
-- Create the executask database
CREATE DATABASE executask;

-- Create database with specific owner
CREATE DATABASE executask OWNER postgres;
```

### List Databases

```sql
-- Inside psql
\l

-- From command line
psql -U postgres -c "\l"
```

### Connect to Database

```sql
-- Inside psql
\c executask

-- Switch to different database
\c postgres
```

### Drop Database

```sql
-- Drop the database (WARNING: This deletes all data!)
DROP DATABASE executask;

-- Drop if exists (no error if doesn't exist)
DROP DATABASE IF EXISTS executask;
```

### Recreate Database

```sql
-- Drop and recreate (useful for fresh start)
DROP DATABASE IF EXISTS executask;
CREATE DATABASE executask;
```

## User Management Commands

### Set/Change Password

```sql
-- Set password for postgres user
ALTER USER postgres WITH PASSWORD 'admin';

-- Create new user with password
CREATE USER executask_user WITH PASSWORD 'your_password';

-- Grant privileges to user
GRANT ALL PRIVILEGES ON DATABASE executask TO executask_user;
```

### List Users

```sql
-- Inside psql
\du

-- From SQL
SELECT usename FROM pg_user;
```

## Table and Schema Commands

### List Tables

```sql
-- Inside psql (must be connected to database)
\dt

-- List all tables with schema
\dt *.*

-- From SQL
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Describe Table Structure

```sql
-- Inside psql
\d table_name

-- Show detailed table info
\d+ table_name
```

### Show Database Size

```sql
-- Size of current database
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Size of specific database
SELECT pg_size_pretty(pg_database_size('executask'));

-- Size of all databases
SELECT datname, pg_size_pretty(pg_database_size(datname)) 
FROM pg_database 
ORDER BY pg_database_size(datname) DESC;
```

## Query and Data Commands

### Run SQL Query from Command Line

```powershell
# Run single query
psql -U postgres -d executask -c "SELECT version();"

# Run query from file
psql -U postgres -d executask -f script.sql

# Run query and output to file
psql -U postgres -d executask -c "SELECT * FROM users;" -o output.txt
```

### Backup and Restore

```powershell
# Backup database
pg_dump -U postgres -d executask -F c -f executask_backup.dump

# Backup as SQL file
pg_dump -U postgres -d executask -f executask_backup.sql

# Restore from dump
pg_restore -U postgres -d executask executask_backup.dump

# Restore from SQL file
psql -U postgres -d executask -f executask_backup.sql
```

## Connection Testing

### Test Connection

```powershell
# Test basic connection
psql -h localhost -p 5432 -U postgres -d executask -c "SELECT 1;"

# Test with version check
psql -h localhost -p 5432 -U postgres -d executask -c "SELECT version();"

# Test connection and list tables
psql -h localhost -p 5432 -U postgres -d executask -c "\dt"
```

### Check Active Connections

```sql
-- Show all active connections
SELECT * FROM pg_stat_activity;

-- Show connections to specific database
SELECT * FROM pg_stat_activity WHERE datname = 'executask';

-- Count connections per database
SELECT datname, count(*) 
FROM pg_stat_activity 
GROUP BY datname;
```

### Terminate Connections

```sql
-- Terminate specific connection
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'executask' AND pid <> pg_backend_pid();

-- Terminate all connections to database (useful before dropping)
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'executask'
  AND pid <> pg_backend_pid();
```

## psql Meta-Commands

### Essential psql Commands

```sql
-- Help
\?                  -- List all psql commands
\h                  -- SQL command help
\h CREATE TABLE     -- Help for specific SQL command

-- Database info
\l                  -- List databases
\c dbname           -- Connect to database
\dt                 -- List tables
\dv                 -- List views
\di                 -- List indexes
\ds                 -- List sequences
\df                 -- List functions

-- Schema info
\dn                 -- List schemas
\d table_name       -- Describe table
\d+ table_name      -- Detailed table description

-- User info
\du                 -- List users/roles
\dp                 -- List table privileges

-- Settings
\timing on          -- Show query execution time
\x                  -- Toggle expanded display
\q                  -- Quit psql
```

## Configuration Files

### Important File Locations

```plaintext
PostgreSQL Data Directory:
C:\Program Files\PostgreSQL\14\data\

Configuration Files:
- postgresql.conf    (Main configuration)
- pg_hba.conf       (Authentication configuration)
- pg_ident.conf     (User mapping)
```

### Edit Authentication (pg_hba.conf)

```plaintext
# Location
C:\Program Files\PostgreSQL\14\data\pg_hba.conf

# Example entries
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# For trust authentication (development only)
host    all             all             127.0.0.1/32            trust
```

**Note:** After editing `pg_hba.conf`, restart PostgreSQL:
```powershell
Restart-Service postgresql-x64-*
```

## Troubleshooting Commands

### Check PostgreSQL Version

```powershell
# From command line
psql --version

# From SQL
psql -U postgres -c "SELECT version();"
```

### Check Port Usage

```powershell
# Check if port 5432 is in use
netstat -ano | findstr :5432

# Find process using port
Get-Process -Id (Get-NetTCPConnection -LocalPort 5432).OwningProcess
```

### View PostgreSQL Logs

```powershell
# Log location (adjust version)
cd "C:\Program Files\PostgreSQL\14\data\log"

# View latest log
Get-Content -Path (Get-ChildItem | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName -Tail 50
```

### Reset postgres Password (if forgotten)

1. Edit `pg_hba.conf` and change authentication to `trust`
2. Restart PostgreSQL service
3. Connect without password: `psql -U postgres`
4. Change password: `ALTER USER postgres WITH PASSWORD 'new_password';`
5. Revert `pg_hba.conf` to `scram-sha-256`
6. Restart PostgreSQL service

## Quick Reference for ExecuTask

### Connect to ExecuTask Database

```powershell
psql -h localhost -p 5432 -U postgres -d executask
```

### Recreate Database (Fresh Start)

```powershell
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS executask;"
psql -U postgres -c "CREATE DATABASE executask;"
```

### Backup ExecuTask Database

```powershell
# Create backup
pg_dump -U postgres -d executask -F c -f "executask_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"
```

### Check Database Status

```powershell
psql -U postgres -d executask -c "SELECT 
    current_database() as database,
    current_user as user,
    version() as version,
    pg_size_pretty(pg_database_size(current_database())) as size;"
```

## Environment Variables (Optional)

To avoid entering password every time, you can set environment variables:

```powershell
# Set for current session
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGUSER = "postgres"
$env:PGPASSWORD = "admin"
$env:PGDATABASE = "executask"

# Now you can connect simply with:
psql
```

**Security Note:** Setting `PGPASSWORD` in environment is not recommended for production. Use `.pgpass` file instead.

## Common Workflows

### Daily Development Workflow

```powershell
# 1. Check if PostgreSQL is running
Get-Service postgresql*

# 2. Connect to database
psql -U postgres -d executask

# 3. Run migrations (from your app)
# Your application handles this

# 4. Check tables
\dt

# 5. Exit
\q
```

### Database Reset Workflow

```sql
-- 1. Connect to postgres database
psql -U postgres

-- 2. Terminate connections
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'executask'
  AND pid <> pg_backend_pid();

-- 3. Drop and recreate
DROP DATABASE executask;
CREATE DATABASE executask;

-- 4. Exit and reconnect
\q
psql -U postgres -d executask
```

---

**Last Updated:** 2026-01-17  
**Database:** executask  
**PostgreSQL Version:** 18.1
