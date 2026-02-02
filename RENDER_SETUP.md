# Render Dashboard Configuration Guide

## API Service Manual Setup (If render.yaml doesn't work)

If Render isn't automatically picking up `render.yaml`, manually configure via the dashboard:

### Create Web Service

1. **Dashboard** → **New +** → **Web Service**
2. **Connect Repository**: Select `godigitifyhq/sip`
3. **Configure Service**:

| Field | Value |
|-------|-------|
| **Name** | `sip-api-service` |
| **Environment** | `Node` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `apps/api-service` |
| **Build Command** | `npm install --include=dev && npx prisma generate && npm run build` |
| **Start Command** | `node dist/apps/api-service/src/main.js` |
| **Plan** | `Starter` ($7/month) |

⚠️ **CRITICAL**: Set **Root Directory** to `apps/api-service` - this is the key fix!

### Environment Variables

Click **Environment** and add:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=<generate-32-char-secret>
REFRESH_TOKEN_SECRET=<generate-32-char-secret>
ENCRYPTION_KEY=<generate-32-char-encryption-key>
CORS_ORIGIN=https://<your-vercel-domain>
OPENAI_API_KEY=<from-openai-dashboard>
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_BUCKET=sip-assets
S3_ACCESS_KEY=<your-access-key>
S3_SECRET_KEY=<your-secret-key>
S3_REGION=sgp1
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASSWORD=<your-app-password>
KYC_API_KEY=<your-kyc-api-key>
KYC_API_SECRET=<your-kyc-secret>
```

**Database URLs** (add after creating databases):
```
DATABASE_URL=postgresql://user:pass@host:5432/sip
REDIS_URL=redis://:password@host:port
AI_ENGINE_URL=https://sip-ai-engine.onrender.com
```

### Deploy

Click **Create Web Service** → Wait for build to complete

---

## Database Setup

### PostgreSQL

1. **Dashboard** → **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `sip-postgres`
   - **Database**: `sip`
   - **User**: `sip_user` (auto-generated)
   - **Plan**: `Starter` ($7/month)

3. **After creation**:
   - Copy **Internal Database URL** to API service `DATABASE_URL`
   - SSH into API service:
     ```bash
     ssh <render-service-url>
     cd /opt/render/project/repo
     npm run db:migrate
     npm run db:seed  # optional
     ```

### Redis

1. **Dashboard** → **New +** → **Redis**
2. Configure:
   - **Name**: `sip-redis`
   - **Plan**: `Starter` ($7/month)

3. **After creation**:
   - Copy **Internal Redis URL** to API service `REDIS_URL`

---

## AI Engine Manual Setup

1. **Dashboard** → **New +** → **Web Service**
2. **Configure Service**:

| Field | Value |
|-------|-------|
| **Name** | `sip-ai-engine` |
| **Environment** | `Python 3` |
| **Branch** | `main` |
| **Root Directory** | `apps/ai-engine` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python -m uvicorn main:app --host 0.0.0.0 --port 10000` |
| **Plan** | `Starter` ($7/month) |

⚠️ **CRITICAL**: Set **Root Directory** to `apps/ai-engine`

### Environment Variables

```
PYTHONUNBUFFERED=true
PORT=10000
OPENAI_API_KEY=<from-openai-dashboard>
DATABASE_URL=<from-postgresql>
```

---

## Verify Deployments

### API Service Logs

Dashboard → `sip-api-service` → **Logs** tab

Look for:
```
✓ Connected to database
✓ Connected to Redis
✓ Server listening on port 3001
```

### Test Endpoints

```bash
# Health check
curl https://sip-api-service.onrender.com/api/v1/health

# Database connection
curl https://sip-api-service.onrender.com/api/v1/users
```

### AI Engine Logs

Dashboard → `sip-ai-engine` → **Logs** tab

Look for:
```
INFO:     Uvicorn running on http://0.0.0.0:5000
```

---
 or `Error: Cannot find module '/opt/render/project/src/apps/api-service/dist/main.js'`

**Root Cause**: Incorrect Root Directory configuration in Render dashboard.

**Solution**:
1. Go to your service → **Settings** → **Build & Deploy**
2. Set **Root Directory** to `apps/api-service`
3. Update **Build Command** to: `npm install && npx prisma generate && npm run build`
4. Update **Start Command** to: `node dist/main.js`
5. Click **Save Changes**
6. Go to **Manual Deploy** → **Clear build cache & deploy**

This tells Render to work from the `apps/api-service` directory, so when it runs `node dist/main.js`, it's looking in `apps/api-service/dist/main.js` (which is correct).

**Solution**:
1. Verify build command output: Check **Logs** → **Build**
2. Ensure `dist/` folder exists after build
3. Use absolute path: `bash apps/api-service/start.sh`

### Issue: Prisma Client Not Found

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
1. Add to build command: `npm run prisma:generate`
2. Verify `@prisma/client` in `package.json` dependencies

### Issue: Database Connection Timeout

**Error**: `connect ETIMEDOUT`

**Solution**:
1. Verify `DATABASE_URL` format
2. Check PostgreSQL instance is running
3. Ensure services are linked (Dashboard → Service → Environments)

### Issue: Port Already in Use

**Error**: `Error: listen EADDRINUSE :::3001`

**Solution**:
1. Ensure `PORT` env var is set to `3001`
2. Check only one instance is running

---

## Scaling & Monitoring

### Upgrade Instance Size

1. Service → **Instance Type**
2. Select higher tier (Pro/Business)
3. Apply changes (auto-deploys)

### Monitor Metrics

Dashboard → Service → **Metrics** tab:
- CPU usage
- Memory usage
- Network I/O
- Request latency

### Set Up Alerts

Dashboard → Service → **Settings** → **Notifications**:
- Failed deploys
- CPU > 80%
- Memory > 80%

---

## Environment Variables Cheat Sheet

**Required**:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<32-char-random>
CORS_ORIGIN=https://your-vercel-domain
OPENAI_API_KEY=sk-...
```

**Optional**:
```bash
AWS_ACCESS_KEY_ID=<for-s3>
AWS_SECRET_ACCESS_KEY=<for-s3>
LOG_LEVEL=debug
```

---

## Troubleshooting Checklist

- [ ] Build command includes `prisma:generate`
- [ ] Start command points to correct `dist/` location
- [ ] All environment variables are set
- [ ] Database is created and URL is correct
- [ ] Redis is created and URL is correct
- [ ] Services are linked in environment variables
- [ ] Port is set to 3001 (not default 8080)
- [ ] Node version is 20.x
- [ ] Python version is 3.12 (for AI engine)

---

## Next Steps

1. Create PostgreSQL instance
2. Create Redis instance
3. Set up API service with all env vars
4. Run migrations: `npm run db:migrate`
5. Test health endpoint
6. Deploy AI engine
7. Configure CI/CD on GitHub
