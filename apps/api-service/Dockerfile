# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-service/package.json ./apps/api-service/
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/api-service
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/api-service/dist ./dist
COPY --from=builder /app/apps/api-service/node_modules ./node_modules
COPY --from=builder /app/apps/api-service/package.json ./package.json
COPY --from=builder /app/apps/api-service/prisma ./prisma

USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"]
