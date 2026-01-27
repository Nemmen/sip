# SIP - Student Internship Portal

> **Production-grade, enterprise-scale monorepo** for eliminating internship scams, ghosting, and skill mismatch.

![License](https://img.shields.io/badge/license-Proprietary-red)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)

---

## 🎯 Overview

**SIP (Student Internship Portal)** is a comprehensive, secure platform that connects students with verified employers while eliminating common pain points in the internship market.

### Key Features

✅ **Scam Prevention** - KYC-verified employers with trust scores  
✅ **Payment Security** - Escrow-based milestone payment system  
✅ **Smart Matching** - AI-powered skill matching using embeddings  
✅ **Progress Tracking** - Real-time application and milestone tracking  
✅ **Verified Communication** - Secure messaging between parties  

---

## 🏗️ Architecture

**Turborepo Monorepo** with three main applications:

```
/apps
  /web-app        → Next.js 14 (Student/Employer/Admin dashboards)
  /api-service    → NestJS (REST API + WebSocket)
  /ai-engine      → FastAPI + Python (ML matching service)

/libs
  /shared-types   → TypeScript interfaces
  /constants      → Shared constants
  /validation     → Zod schemas

/infrastructure   → Terraform (DigitalOcean IaC)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 19, TypeScript, Tailwind CSS, PWA |
| **Backend** | NestJS, Prisma ORM, PostgreSQL 16, Redis 7, BullMQ |
| **AI/ML** | FastAPI, pgvector, OpenAI API, LangChain |
| **Infrastructure** | Docker, DigitalOcean, Terraform, GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 7
- Python >= 3.11

### 1. Installation

```bash
# Clone repository
git clone https://github.com/your-org/sip.git
cd sip

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials
```

### 2. Database Setup

```bash
cd apps/api-service

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed test data
npm run prisma:seed
```

### 3. Start Development

```bash
# From root directory

# All services
npm run dev

# Or individually
npm run web    # → http://localhost:3000
npm run api    # → http://localhost:3001
npm run ai     # → http://localhost:8000
```

### 4. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sip.com | Admin@123 |
| Employer | employer@example.com | Employer@123 |
| Student | student@example.com | Student@123 |

---

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services:**
- postgres:5432
- redis:6379
- api:3001
- web:3000
- ai-engine:8000

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT + Refresh Tokens |
| **Authorization** | Role-based (RBAC) + KYC Guards |
| **Data Encryption** | Column-level PII encryption |
| **File Storage** | Signed URLs (DO Spaces) |
| **API Security** | Rate limiting, Helmet, CORS |
| **Audit Trail** | Complete action logging |

---

## 💳 Escrow Workflow

```mermaid
graph LR
    A[Employer Creates Milestone] --> B[Funds Escrow]
    B --> C[FUNDS_HELD]
    C --> D[Student Completes Work]
    D --> E[Employer Approves]
    E --> F[BullMQ Queue]
    F --> G[PSP Payout]
    G --> H[RELEASED - Student Paid]
```

**Features:**
- Async processing with retry logic
- Idempotent operations
- Dispute resolution
- Full transaction logging

---

## 🤖 AI Matching

**Capabilities:**
1. Skill embeddings (pgvector)
2. Semantic similarity search
3. Match score calculation (0-1)
4. Skill gap analysis
5. Personalized recommendations

**API Example:**
```typescript
POST /api/v1/match/skills
{
  "student_skills": ["React", "Node.js"],
  "internship_skills": ["React", "TypeScript", "PostgreSQL"]
}

// Response
{
  "match_score": 0.67,
  "matched_skills": ["React"],
  "skill_gaps": ["TypeScript", "PostgreSQL"],
  "recommendations": [...]
}
```

---

## 📊 Database Schema

### Core Entities

- **users** - Authentication & roles
- **student_profiles** / **employer_profiles**
- **internships** - Job postings
- **applications** - Student applications
- **milestones** - Payment milestones
- **escrow_transactions** - Payment records
- **messages** - Chat system
- **notifications** - User alerts
- **kyc_documents** - Verification
- **audit_logs** - System trail
- **skill_embeddings** - AI vectors

---

## 🧪 Testing

```bash
# Lint & format
npm run lint
npm run format

# Type checking
npm run build

# Unit tests
npm run test

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 🚢 Production Deployment

### Option 1: DigitalOcean + Terraform

```bash
cd infrastructure

# Initialize
terraform init

# Configure
export TF_VAR_do_token="your-token"
export TF_VAR_jwt_secret="your-secret"

# Deploy
terraform plan
terraform apply
```

**Creates:**
- VPC with private subnet
- Managed PostgreSQL + Redis
- App Platform instances
- DO Spaces bucket
- Load balancers

### Option 2: Manual

```bash
# Build
npm run build

# Start
cd apps/api-service && npm run start:prod
cd apps/web-app && npm run start
cd apps/ai-engine && uvicorn main:app --host 0.0.0.0
```

### Option 3: CI/CD

Push to `main` → Automatic deployment via GitHub Actions

---

## 📡 API Documentation

Interactive docs: http://localhost:3001/api/docs

### Key Endpoints

**Authentication**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

**Internships**
- `GET /api/v1/internships` (public)
- `POST /api/v1/internships` (employer + KYC)
- `PUT /api/v1/internships/:id/publish`

**Applications**
- `POST /api/v1/applications` (student)
- `PUT /api/v1/applications/:id/status` (employer)

**Escrow**
- `POST /api/v1/escrow/milestones`
- `POST /api/v1/escrow/fund`
- `PUT /api/v1/escrow/approve/:id`

**KYC**
- `POST /api/v1/kyc/submit` (employer)
- `PUT /api/v1/kyc/review/:id` (admin)

---

## 🎨 Brand Guidelines

| Element | Value |
|---------|-------|
| **Primary Color** | #243447 |
| **Accent Color** | #E1A337 |
| **Light Background** | #F3EEE6 |
| **Font** | Montserrat |
| **Style** | Professional, trustworthy, structured |

---

## 📚 Documentation

- [Technical Documentation](./TECHNICAL_DOCS.md)
- [API Documentation](http://localhost:3001/api/docs)
- [Database Schema](./apps/api-service/prisma/schema.prisma)
- [Environment Variables](./.env.example)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

**Proprietary** - All rights reserved © 2026 SIP

---

## 👥 Support

For questions or issues:
- Email: support@sip.com
- Issues: GitHub Issues
- Docs: [Technical Documentation](./TECHNICAL_DOCS.md)

---

**Built with ❤️ for students and employers**
