# Multi-Stage Production Dockerfile for E-Lanka Backend Engine
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and workspace configuration
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

# Install build dependencies
RUN npm ci

# Copy sources
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/

# Build TypeScript packages
RUN npm run build --workspace=@e-lanka/shared
RUN npm run build --workspace=@e-lanka/backend

# Production Runner Image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/public/health || exit 1

CMD ["node", "packages/backend/dist/server.js"]
