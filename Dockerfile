# Multi-stage build for Torro License Manager

# Stage 1: Build the React frontend
FROM node:16-alpine AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci --silent

# Copy client source code
COPY client/ ./

# Build the React app
RUN npm run build

# Stage 2: Build the backend and combine with frontend
FROM node:16-alpine AS production

# Create app directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S torro -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy backend source code
COPY --chown=torro:nodejs . .

# Copy built frontend from previous stage
COPY --from=frontend-builder --chown=torro:nodejs /app/client/build ./client/build

# Create necessary directories
RUN mkdir -p logs backups && chown -R torro:nodejs logs backups

# Switch to non-root user
USER torro

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

