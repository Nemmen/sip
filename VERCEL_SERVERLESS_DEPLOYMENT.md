# Vercel Serverless Deployment Guide

This guide provides step-by-step instructions for deploying the Student Internship Portal (SIP) on Vercel as a fully serverless application.

## Architecture Overview

The application has been restructured for Vercel deployment:

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Platform                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Next.js Application (web-app)              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Pages &   │  │  API Routes │  │   Python    │  │   │
│  │  │ Components  │  │ (Serverless)│  │  Functions  │  │   │
│  │  │   (SSR)     │  │  /api/v1/*  │  │  /api/ai/*  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     External Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  PostgreSQL │  │    Redis    │  │  S3/Blob Storage   │ │
│  │ (Neon/Supabase)│ │  (Upstash)  │  │(Vercel Blob/S3)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Use one of:
   - [Neon](https://neon.tech) (Recommended - Vercel Integration)
   - [Supabase](https://supabase.com)
   - [PlanetScale](https://planetscale.com)
3. **GitHub Account**: For source control integration

## Step 1: Database Setup

### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy the connection string (pooled connection):
   ```
   postgresql://user:password@ep-xxx-yyy.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → Database
3. Copy the connection string (URI format)

### Option C: Vercel Postgres (Direct Integration)

1. In Vercel Dashboard, go to Storage
2. Create a new Postgres database
3. Connect to your project

## Step 2: Local Setup & Testing

```bash
# Clone the repository
git clone https://github.com/godigitifyhq/sip.git
cd sip

# Install dependencies
npm install

# Navigate to web-app
cd apps/web-app

# Install web-app dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Public URL (leave empty for local, set for production)
NEXT_PUBLIC_API_URL=""
```

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed

# Test locally
npm run dev
```

Visit `http://localhost:3000` to verify everything works.

## Step 3: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel


# Deploy from project root
cd d:\web_all\sip
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: sip
# - Directory: ./
# - Override settings? No
```

### Method 2: GitHub Integration

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)

3. Import your GitHub repository

4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `cd apps/web-app && npx prisma generate && npm run build`
   - **Output Directory**: `apps/web-app/.next`
   - **Install Command**: `npm install`

5. Click **Deploy**

## Step 4: Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string | Production, Preview, Development |
| `JWT_SECRET` | Strong random string (32+ chars) | Production, Preview, Development |
| `JWT_REFRESH_SECRET` | Strong random string (32+ chars) | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | Leave empty (uses relative paths) | Production |

### Generate Secure Secrets

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## Step 5: Run Database Migrations

After first deployment, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or via Vercel build hook (add to package.json)
"scripts": {
  "vercel-build": "prisma generate && prisma migrate deploy && next build"
}
```

## Step 6: Verify Deployment

1. **Health Check**: Visit `https://your-app.vercel.app/api/ai/health`
   
2. **API Test**: Test authentication
   ```bash
   curl -X POST https://your-app.vercel.app/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","role":"STUDENT"}'
   ```

3. **Frontend**: Visit `https://your-app.vercel.app`

## API Endpoints

All API endpoints are now serverless functions:

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh tokens

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile

### Internships
- `GET /api/v1/internships` - List internships
- `POST /api/v1/internships` - Create internship (Employer)
- `GET /api/v1/internships/:id` - Get internship
- `PUT /api/v1/internships/:id` - Update internship
- `DELETE /api/v1/internships/:id` - Delete internship

### Applications
- `GET /api/v1/applications` - List applications
- `POST /api/v1/applications` - Apply to internship (Student)
- `GET /api/v1/applications/:id` - Get application
- `PUT /api/v1/applications/:id` - Update application status
- `DELETE /api/v1/applications/:id` - Withdraw application

### AI Functions (Python)
- `GET /api/ai/health` - Health check
- `POST /api/ai/match` - Skill matching
- `POST /api/ai/recommendations` - Get recommendations

### Admin
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/stats` - Dashboard statistics

## Troubleshooting

### Build Failures

1. **Prisma Client Not Generated**
   ```
   Error: @prisma/client did not initialize yet
   ```
   Solution: Ensure `prisma generate` runs before build:
   ```json
   "build": "prisma generate && next build"
   ```

2. **Module Not Found**
   ```
   Module not found: Can't resolve '@/lib/prisma'
   ```
   Solution: Check `tsconfig.json` has proper path aliases

### Runtime Errors

1. **Database Connection Failed**
   - Verify `DATABASE_URL` is set correctly
   - Ensure SSL mode is enabled: `?sslmode=require`
   - Check if IP is whitelisted (Supabase/Neon)

2. **Authentication Errors**
   - Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
   - Ensure secrets are at least 32 characters

### Function Timeout

Default timeout is 10s for Hobby, 60s for Pro. For longer operations:

```json
// vercel.json
{
  "functions": {
    "apps/web-app/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Performance Optimization

### 1. Database Connection Pooling

Use connection pooling for PostgreSQL:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 2. Edge Runtime (Optional)

For faster cold starts on simple endpoints:

```typescript
// app/api/v1/health/route.ts
export const runtime = 'edge';

export async function GET() {
  return Response.json({ status: 'healthy' });
}
```

### 3. Caching

Use Vercel's caching headers:

```typescript
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

## Monitoring & Logs

1. **Vercel Dashboard**: View function logs and analytics
2. **Vercel Analytics**: Enable for performance insights
3. **Error Tracking**: Integrate Sentry:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

## Cost Considerations

### Vercel Pricing

| Plan | Serverless Function Invocations | Bandwidth |
|------|--------------------------------|-----------|
| Hobby (Free) | 100,000/month | 100GB |
| Pro | 1,000,000/month | 1TB |
| Enterprise | Unlimited | Unlimited |

### Database Costs

- **Neon**: Free tier with 0.5GB storage
- **Supabase**: Free tier with 500MB storage
- **Vercel Postgres**: Starting at $20/month

## Security Best Practices

1. **Environment Variables**: Never commit secrets
2. **CORS**: Configure properly in `vercel.json`
3. **Rate Limiting**: Implement at API level
4. **Input Validation**: Use Zod schemas
5. **SQL Injection**: Prisma handles parameterized queries

## Rollback

If deployment fails:

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

## Custom Domain

1. Go to Vercel Dashboard → Project → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Configure DNS:
   - CNAME: `app` → `cname.vercel-dns.com`
   - Or A record: `76.76.21.21`

---

## Quick Reference Commands

```bash
# Deploy
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Pull environment variables
vercel env pull

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
