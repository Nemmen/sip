# SIP - Technical Documentation

## 🏗️ System Architecture

### Overview
SIP is a production-grade monorepo built with Turborepo, containing three main applications:

1. **Web App** (Next.js 14) - Frontend application
2. **API Service** (NestJS) - Backend REST API + WebSocket
3. **AI Engine** (FastAPI + Python) - ML-powered matching service

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- React Query (data fetching)
- Zustand (state management)
- Socket.io-client (WebSocket)
- PWA enabled

**Backend:**
- NestJS (Node.js framework)
- Prisma ORM
- PostgreSQL 16
- Redis 7 (caching + queues)
- BullMQ (job processing)
- JWT authentication
- Socket.io (WebSocket)

**AI Service:**
- FastAPI (Python)
- pgvector (embeddings)
- OpenAI API
- LangChain

**Infrastructure:**
- DigitalOcean (Cloud platform)
- Docker + Docker Compose
- Terraform (IaC)
- GitHub Actions (CI/CD)
- Cloudflare (CDN)

## 🔐 Security Architecture

### Authentication
- JWT-based authentication
- Refresh token rotation
- Password hashing with bcrypt (10 rounds)
- Email verification
- OTP support (college email for students)

### Authorization
- Role-based access control (RBAC)
- JWT AuthGuard (validates tokens)
- RolesGuard (checks user roles)
- KYCGuard (ensures KYC verification for employers)

### Data Protection
- Column-level encryption for PII
- Signed URLs for file access (AWS S3/DO Spaces)
- Private database subnet
- Secrets management via environment variables
- SQL injection protection via Prisma ORM
- XSS protection via helmet middleware
- CORS configuration
- Rate limiting (100 req/min)

### Audit Logging
All critical actions are logged:
- Login/logout
- KYC submission
- Escrow funding
- Milestone approval
- Application status changes

## 📊 Database Schema

### Core Tables
- `users` - User accounts (students, employers, admins)
- `student_profiles` - Student information
- `employer_profiles` - Company information
- `kyc_documents` - KYC verification records
- `internships` - Job postings
- `applications` - Student applications
- `milestones` - Payment milestones
- `escrow_transactions` - Payment records
- `messages` - Chat messages
- `notifications` - User notifications
- `audit_logs` - System audit trail
- `skill_embeddings` - AI skill vectors (pgvector)

### Relationships
- User → Student/Employer Profile (1:1)
- User → KYC Documents (1:N)
- Employer → Internships (1:N)
- Internship → Applications (1:N)
- Application → Milestones (1:N)
- Milestone → Escrow Transaction (1:1)

## 💳 Escrow Workflow

### States
1. **PENDING** - Milestone created, not funded
2. **FUNDS_HELD** - Employer has funded escrow
3. **RELEASED** - Payment processed to student
4. **REFUNDED** - Refunded to employer
5. **DISPUTED** - Dispute raised

### Flow
```
1. Employer creates milestones
2. Employer funds escrow via payment gateway
3. System marks as FUNDS_HELD
4. Student completes milestone → submits
5. Employer reviews → approves
6. Job added to BullMQ queue
7. Worker processes payout via PSP API
8. Updates DB → status = PAID
9. Notifications sent to both parties
```

### Features
- Idempotent operations
- Async queue processing
- Automatic retry (3 attempts with exponential backoff)
- Transaction logging
- Dispute resolution workflow

## 🤖 AI Matching System

### Components
1. **Skill Embeddings** - Vector representations of skills
2. **Semantic Search** - Find similar skills/jobs
3. **Match Scoring** - Calculate compatibility
4. **Skill Gap Analysis** - Identify missing skills
5. **Recommendations** - Personalized suggestions

### Implementation
```python
# Generate embeddings
POST /api/v1/embeddings/generate

# Calculate match score
POST /api/v1/match/skills
{
  "student_skills": ["React", "Node.js"],
  "internship_skills": ["React", "TypeScript", "PostgreSQL"]
}

# Response
{
  "match_score": 0.67,
  "matched_skills": ["React"],
  "skill_gaps": ["TypeScript", "PostgreSQL"],
  "recommendations": [...]
}
```

## 🔄 Queue Processing

### Queues
1. **KYC_CHECK** - Background KYC verification
2. **ESCROW_PAYOUT** - Payment processing
3. **AI_MATCHING** - Compute match scores
4. **NOTIFICATIONS** - Send notifications
5. **EMAIL** - Email delivery

### Job Configuration
- Priority levels (1-4)
- Retry mechanism (max 3 attempts)
- Exponential backoff
- Job timeout handling

## 🚀 Deployment

### Development
```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Or individually
npm run web    # Frontend (port 3000)
npm run api    # Backend (port 3001)
npm run ai     # AI service (port 8000)
```

### Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production (DigitalOcean)
```bash
cd infrastructure

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply

# Deploy apps
git push origin main  # Triggers GitHub Actions
```

## 📡 API Documentation

API docs available at: `http://localhost:3001/api/docs`

### Key Endpoints

**Auth:**
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/logout`

**Internships:**
- GET `/api/v1/internships`
- GET `/api/v1/internships/:id`
- POST `/api/v1/internships` (Employer)
- PUT `/api/v1/internships/:id/publish` (Employer)

**Applications:**
- POST `/api/v1/applications` (Student)
- GET `/api/v1/applications/my-applications` (Student)
- GET `/api/v1/applications/internship/:id` (Employer)
- PUT `/api/v1/applications/:id/status` (Employer)

**Escrow:**
- POST `/api/v1/escrow/milestones`
- POST `/api/v1/escrow/fund`
- PUT `/api/v1/escrow/approve/:id`

**KYC:**
- POST `/api/v1/kyc/submit`
- GET `/api/v1/kyc/my-documents`
- PUT `/api/v1/kyc/review/:id` (Admin)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Test Accounts
- **Admin:** admin@sip.com / Admin@123
- **Employer:** employer@example.com / Employer@123
- **Student:** student@example.com / Student@123

## 🔧 Environment Variables

See `.env.example` for all required variables:
- Database credentials
- Redis connection
- JWT secrets
- Storage (S3/DO Spaces)
- Payment gateway
- Email service
- AI API keys

## 📊 Monitoring

### Recommended Tools
- **Application:** New Relic / Datadog
- **Logs:** Papertrail / Logtail
- **Uptime:** UptimeRobot
- **Error Tracking:** Sentry
- **Performance:** Lighthouse CI

## 🔒 Compliance

### GDPR
- User data export
- Right to deletion
- Consent management
- Data minimization

### Security Standards
- OWASP Top 10 protection
- Regular dependency updates
- Security headers (helmet)
- Input validation (class-validator)
- Output sanitization

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [BullMQ Documentation](https://docs.bullmq.io)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

Proprietary - All rights reserved
