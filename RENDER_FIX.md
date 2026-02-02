# 🔧 Quick Fix for Render Deployment Error

## The Problem

```
Error: Cannot find module '/opt/render/project/src/apps/api-service/dist/main.js'
```

Render is looking in the wrong path because the **Root Directory** is not set correctly.

## The Solution (2 minutes)

### Step 1: Update Build Settings in Render Dashboard

Go to your Render service → **Settings** → **Build & Deploy**

Change these settings:

| Setting | Current (Wrong ❌) | New (Correct ✅) |
|---------|-------------------|------------------|
| **Root Directory** | Leave empty or wrong path | `apps/api-service` |
| **Build Command** | `apps/api-service/ $ npm install ; npx turbo run build ; npm run prisma:generate` | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `apps/api-service/ $ node dist/main.js` | `node dist/main.js` |

### Step 2: Clear Cache and Redeploy

1. Scroll to bottom → Click **Save Changes**
2. Go to **Manual Deploy** tab
3. Click **Clear build cache & deploy**

### Why This Works

**Before** (Wrong):
```
Root: /opt/render/project/src
Working Dir: apps/api-service/
Start Command: node dist/main.js
Looks for: /opt/render/project/src/dist/main.js ❌ (doesn't exist)
```

**After** (Correct):
```
Root: /opt/render/project/src
Root Directory: apps/api-service
Working Dir: /opt/render/project/src/apps/api-service
Start Command: node dist/main.js
Looks for: /opt/render/project/src/apps/api-service/dist/main.js ✅ (exists!)
```

## Visual Guide

### In Render Dashboard:

1. **Build Filters** section:
   - **Ignored Paths**: Leave empty or add `apps/web-app/**`, `apps/ai-engine/**`

2. **Build Command** section:
   ```bash
   npm install && npx prisma generate && npm run build
   ```

3. **Pre-Deploy Command** section (Optional):
   ```bash
   npx prisma migrate deploy
   ```

4. **Start Command** section:
   ```bash
   node dist/main.js
   ```

5. **Root Directory** section (MOST IMPORTANT):
   ```
   apps/api-service
   ```

## Expected Build Output

After fixing, your build logs should show:

```
==> Cloning from https://github.com/godigitifyhq/sip...
==> Checking out commit abc123 in branch main
==> Using Node version 20.x
==> Docs on specifying a Node version: https://render.com/docs/node-version
==> Running 'npm install && npx prisma generate && npm run build' in directory '/opt/render/project/src/apps/api-service'
==> Installing packages
==> Generating Prisma Client
==> Building application
==> Build successful!
==> Deploying...
==> Running 'node dist/main.js'
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] Mapped {/health, GET} route
[Nest] INFO [NestApplication] Nest application successfully started
✓ Server running on port 10000
```

## Still Having Issues?

### Issue: Prisma Client not found

**Solution**: Make sure Prisma generate runs BEFORE build:
```bash
npm install && npx prisma generate && npm run build
```

### Issue: Environment variables not working

**Solution**: Check **Environment** tab and ensure all required variables are set:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT=10000`

### Issue: Database migrations not applied

**Solution**: Add Pre-Deploy Command:
```bash
npx prisma migrate deploy
```

## Next: Deploy AI Engine

Once API service is working, set up AI engine with:

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/ai-engine` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python -m uvicorn main:app --host 0.0.0.0 --port 10000` |

## Reference

See [RENDER_SETUP.md](./RENDER_SETUP.md) for complete deployment guide.

---

**Created**: February 3, 2026
