# Quick PostgreSQL Setup for SIP Development
# This script configures PostgreSQL for local development

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Setup for SIP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL installation
$pgPath = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $pgPath) {
    Write-Host "✗ PostgreSQL not found in default location" -ForegroundColor Red
    Write-Host "Please find your PostgreSQL installation and run:" -ForegroundColor Yellow
    Write-Host '  psql -U postgres -c "CREATE DATABASE sip_db;"' -ForegroundColor Yellow
    exit 1
}

$pgDataDir = Join-Path $pgPath.FullName "data"
$pgHbaFile = Join-Path $pgDataDir "pg_hba.conf"

Write-Host "Found PostgreSQL at: $($pgPath.FullName)" -ForegroundColor Green
Write-Host ""
Write-Host "To allow local connections without password:" -ForegroundColor Yellow
Write-Host "1. Open: $pgHbaFile" -ForegroundColor White
Write-Host "2. Find lines starting with 'host' for IPv4 and IPv6" -ForegroundColor White
Write-Host "3. Change 'scram-sha-256' or 'md5' to 'trust'" -ForegroundColor White
Write-Host "4. Restart PostgreSQL service" -ForegroundColor White
Write-Host ""
Write-Host "After that, run:" -ForegroundColor Yellow
Write-Host '  psql -U postgres -c "CREATE DATABASE sip_db;"' -ForegroundColor White
Write-Host ""
Write-Host "OR manually create database using pgAdmin" -ForegroundColor Yellow
Write-Host ""
