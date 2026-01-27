# SIP Backend Setup Guide

## ✅ Current Status

- ✅ **PostgreSQL 16**: Installed and running
- ✅ **Redis**: Running on port 6379
- ⚠️ **Database**: Needs password configuration

## 🔧 Database Setup Options

### Option 1: Using pgAdmin (Recommended - Easiest)

1. Open **pgAdmin** (should be installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on **Databases** → **Create** → **Database**
4. Name: `sip_db`
5. Click **Save**

### Option 2: Command Line (If you know your PostgreSQL password)

```powershell
# Set your password and run
$env:PGPASSWORD='YOUR_PASSWORD_HERE'
psql -U postgres -c "CREATE DATABASE sip_db;"
```

### Option 3: SQL Script

1. Open **pgAdmin**
2. Open **Query Tool** (Tools menu)
3. Open and execute: `database-setup.sql`

## 🚀 After Database Creation

1. **Update .env file** with your PostgreSQL password:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sip_db?schema=public"
   ```

2. **Run migrations**:
   ```powershell
   cd apps/api-service
   npx prisma migrate dev --name init
   ```

3. **Seed database** (optional test data):
   ```powershell
   npx prisma db seed
   ```

4. **Start the API**:
   ```powershell
   cd apps/api-service
   npx ts-node src/main.ts
   ```

## 🐛 Troubleshooting

### If you forgot PostgreSQL password:

1. Open pgAdmin
2. Right-click on **PostgreSQL 16 server**
3. **Properties** → **Connection** tab
4. Update password
5. Click **Save**

### If pg_hba.conf needs updating:

Location: `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`

Change IPv4/IPv6 lines from:
```
host    all   all   127.0.0.1/32   scram-sha-256
```

To:
```
host    all   all   127.0.0.1/32   trust
```

Then restart PostgreSQL service.

## 📦 Services Running

- **Frontend**: http://localhost:3000 (Next.js)
- **Backend API**: http://localhost:3001/api/v1 (will start after database setup)
- **API Docs**: http://localhost:3001/api/docs (Swagger)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🎯 Test Accounts (after seeding)

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@sip.com          | Admin@123    |
| Employer | employer@example.com   | Employer@123 |
| Student  | student@example.com    | Student@123  |
