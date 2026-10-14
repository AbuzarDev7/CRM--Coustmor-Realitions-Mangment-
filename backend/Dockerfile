# Use Node.js 20 LTS Alpine image for a lightweight footprint
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 3000

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["npm", "start"]
