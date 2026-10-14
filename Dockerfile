# ==========================================
# Unified All-in-One Dockerfile
# Builds both Frontend and Backend together
# ==========================================

# Stage 1: Build Frontend (Vite + React)
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend dependencies and install
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
ARG VITE_BACKEND_URL=http://localhost:3000
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

# Stage 2: Runtime Backend & Static Serving
FROM node:20-alpine AS runner

WORKDIR /app

# Install native compilation dependencies for bcrypt
RUN apk add --no-cache python3 make g++

# Copy backend dependencies and install production packages
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend code
COPY backend/ ./

# Copy built frontend static assets into backend
COPY --from=frontend-builder /frontend/dist ./public

# Configure unified serving
ENV NODE_ENV=production
ENV PORT=3000
ENV SERVE_FRONTEND=true
ENV CLIENT_DIST_PATH=/app/public

EXPOSE 3000

CMD ["npm", "start"]
