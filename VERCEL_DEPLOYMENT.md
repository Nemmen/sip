# Vercel Deployment Guide

## Overview

This monorepo contains three services:
- **web-app**: Next.js frontend (deployable on Vercel)
- **api-service**: NestJS backend (needs separate hosting)
- **ai-engine**: Python AI service (needs separate hosting)

## Deployment Architecture

```
┌─────────────┐
│   Vercel    │ ← Next.js Web App (apps/web-app)
└──────┬──────┘
       │
       ↓ API Calls
┌─────────────┐
│   Render    │ ← NestJS API (apps/api-service)
│  Railway    │ ← Python AI (apps/ai-engine)
│   Fly.io    │ ← PostgreSQL + Redis
└─────────────┘
```

## Step-by-Step Deployment

### 1. Deploy Backend Services First

#### Option A: Deploy on Render (Recommended)
See [RENDER_SETUP.md](./RENDER_SETUP.md) for detailed instructions.

#### Option B: Deploy on Railway
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Create new project: `railway init`
4. Deploy API service:
   ```bash
   railway up -s api-service -d apps/api-service
   ```
5. Deploy AI engine:
   ```bash
   railway up -s ai-engine -d apps/ai-engine
   ```
6. Add PostgreSQL and Redis services in Railway dashboard

### 2. Deploy Frontend on Vercel

#### Prerequisites
- Backend services deployed and running
- API and WebSocket URLs available

#### A. Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   cd d:/web_all/sip
   vercel
   ```

4. **Configure Project Settings**
   - Framework Preset: **Next.js**
   - Root Directory: **`./` (keep as root)**
   - Build Command: **`turbo run build --filter=web-app`**
   - Output Directory: **`apps/web-app/.next`**
   - Install Command: **`npm install`**

5. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   # Enter your backend API URL (e.g., https://your-api.onrender.com/api/v1)
   
   vercel env add NEXT_PUBLIC_WS_URL
   # Enter your WebSocket URL (e.g., wss://your-api.onrender.com)
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

#### B. Deploy via Vercel Dashboard (Easier)

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository `godigitifyhq/sip`

3. **Configure Build Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as-is)
   - **Build Command**: 
     ```
     turbo run build --filter=web-app
     ```
   - **Output Directory**: 
     ```
     apps/web-app/.next
     ```
   - **Install Command**: 
     ```
     npm install
     ```

4. **Add Environment Variables**
   In Vercel dashboard → Settings → Environment Variables:
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com/api/v1` | Production, Preview, Development |
   | `NEXT_PUBLIC_WS_URL` | `wss://your-api.onrender.com` | Production, Preview, Development |

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)

## Environment Variables

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com/api/v1
NEXT_PUBLIC_WS_URL=wss://your-api-url.onrender.com
```

### Backend (Render/Railway)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=32-character-key
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_BUCKET=sip-assets
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASSWORD=your-password
KYC_API_KEY=your-kyc-key
OPENAI_API_KEY=your-openai-key
AI_ENGINE_URL=https://your-ai-engine-url
NODE_ENV=production
PORT=3001
```

## Post-Deployment Steps

### 1. Test the Deployment
```bash
# Test frontend
curl https://your-app.vercel.app

# Test API
curl https://your-api.onrender.com/api/v1/health
```

### 2. Set Up Custom Domain (Optional)
In Vercel dashboard → Settings → Domains:
- Add your custom domain
- Configure DNS records as instructed

### 3. Enable CORS on Backend
Ensure your API service allows requests from your Vercel domain:

```typescript
// apps/api-service/src/main.ts
app.enableCors({
  origin: [
    'https://your-app.vercel.app',
    'https://www.yourdomain.com',
    'http://localhost:3000' // for local dev
  ],
  credentials: true
});
```

### 4. Database Migration
```bash
# Connect to your production database
cd apps/api-service
DATABASE_URL="your-production-db-url" npm run prisma:migrate deploy
```

### 5. Monitor Deployments
- **Vercel**: Check deployment logs in Vercel dashboard
- **Backend**: Check logs in Render/Railway dashboard

## Continuous Deployment

Vercel will automatically deploy when you push to GitHub:

- **Main branch** → Production deployment
- **Other branches** → Preview deployments

To disable auto-deploy:
- Vercel dashboard → Settings → Git → Disable auto-deploy

## Troubleshooting

### Build Fails on Vercel

**Error**: "Cannot find module 'libs/shared-types'"

**Solution**: Ensure workspace dependencies are properly configured:
```bash
# In root package.json, verify:
"workspaces": [
  "apps/*",
  "libs/*"
]
```

### API Connection Failed

**Error**: "Network error" or CORS errors

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend CORS settings
3. Ensure backend is running and accessible

### WebSocket Connection Failed

**Solution**:
1. Verify `NEXT_PUBLIC_WS_URL` uses `wss://` protocol
2. Check backend WebSocket configuration
3. Ensure Render/Railway allows WebSocket connections

### Environment Variables Not Working

**Solution**:
1. Environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in browser
2. Redeploy after adding new environment variables
3. Check Vercel dashboard → Settings → Environment Variables

## Performance Optimization

### 1. Enable Edge Runtime (Optional)
For faster response times globally:

```typescript
// apps/web-app/app/layout.tsx
export const runtime = 'edge';
```

### 2. Enable Image Optimization
Vercel automatically optimizes images via Next.js Image component.

### 3. Configure Caching
Vercel automatically handles caching for static assets.

## Cost Estimation

### Vercel (Frontend)
- **Hobby Plan**: Free
  - Unlimited personal projects
  - 100 GB bandwidth/month
  - Serverless function execution

- **Pro Plan**: $20/month
  - Commercial projects
  - 1 TB bandwidth/month
  - Advanced analytics

### Backend (Render/Railway)
See [RENDER_SETUP.md](./RENDER_SETUP.md) for backend hosting costs.

## Quick Reference Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull

# View logs
vercel logs [deployment-url]
```

## Alternative: Deploy Everything on Vercel (Advanced)

If you want to deploy the API as serverless functions on Vercel:

1. Create `apps/web-app/api/` directory
2. Convert NestJS controllers to Vercel serverless functions
3. This requires significant code restructuring

**Not recommended** for this project due to:
- WebSocket requirements
- Long-running AI processes
- Database connection pooling limitations
- Complex background jobs

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- GitHub Issues: Create an issue in your repository

## Next Steps

1. ✅ Deploy backend services (Render/Railway)
2. ✅ Deploy frontend to Vercel
3. ✅ Configure environment variables
4. ✅ Run database migrations
5. ✅ Test all functionality
6. ✅ Set up custom domain
7. ✅ Monitor and optimize

---

**Last Updated**: February 3, 2026
