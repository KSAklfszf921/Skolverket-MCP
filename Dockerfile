# Skolverket MCP Server - Docker Container
# Multi-stage build för optimal image storlek

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiera package files
COPY package*.json ./
COPY tsconfig.json ./

# Installera ALLA dependencies (skippa prepare script tills vi har source code)
RUN npm ci --ignore-scripts

# Kopiera source code
COPY src ./src

# Bygg TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

WORKDIR /app

# Kopiera package files
COPY package*.json ./

# Installera BARA production dependencies (skippa prepare script)
RUN npm ci --only=production --ignore-scripts

# Kopiera byggda filer från builder stage
COPY --from=builder /app/dist ./dist

# Kopiera public directory med social media images
COPY public ./public

# Skapa logs directory
RUN mkdir -p logs

# Exponera port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Starta Streamable HTTP server (MCP över SSE)
CMD ["node", "dist/streamable-http-server.js"]
