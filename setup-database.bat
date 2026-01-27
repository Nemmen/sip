@echo off
echo ========================================
echo PostgreSQL Database Setup for SIP
echo ========================================
echo.
echo Please enter your PostgreSQL password when prompted.
echo If you don't remember it, you may need to reset it using pgAdmin.
echo.
set /p PGPASS="Enter PostgreSQL password: "
echo.
echo Creating database 'sip_db'...
set PGPASSWORD=%PGPASS%
psql -U postgres -c "CREATE DATABASE sip_db;"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Database 'sip_db' created successfully!
    echo.
    echo Update your .env file with:
    echo DATABASE_URL="postgresql://postgres:%PGPASS%@localhost:5432/sip_db?schema=public"
) else (
    echo.
    echo ✗ Failed to create database. Please check your password.
    echo.
    echo If you forgot your password:
    echo 1. Open pgAdmin
    echo 2. Right-click on PostgreSQL server
    echo 3. Properties → Connection → Update password
)
echo.
pause
