# Multi-stage build for frontend (Next.js)
FROM node:18-alpine AS deps

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Ensure public directory exists for Next.js build
RUN mkdir -p public

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy necessary files from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create public directory if it doesn't exist to avoid copy errors
RUN mkdir -p /app/public

# Copy public directory from builder stage (will be empty if no public assets exist)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ -o /dev/null || exit 1

ENV PORT=3000

CMD ["node", "server.js"]