# Skolverket MCP Server - Docker Container
# Multi-stage build för optimal image storlek

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiera package files
COPY package*.json ./
COPY tsconfig.json ./

# Installera ALLA dependencies (inklusive dev för att bygga)
RUN npm ci

# Kopiera source code
COPY src ./src

# Bygg TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

WORKDIR /app

# Kopiera package files
COPY package*.json ./

# Installera BARA production dependencies (skippa prepare script)
RUN npm ci --only=production --ignore-scripts

# Kopiera byggda filer från builder stage
COPY --from=builder /app/dist ./dist

# Skapa logs directory
RUN mkdir -p logs

# Exponera port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Starta HTTP server
CMD ["node", "dist/http-server.js"]
