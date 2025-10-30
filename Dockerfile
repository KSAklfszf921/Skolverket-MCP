# Skolverket MCP Server - Docker Container
FROM node:18-alpine

# Skapa app directory
WORKDIR /app

# Kopiera package files
COPY package*.json ./
COPY tsconfig.json ./

# Installera dependencies
RUN npm ci --only=production

# Kopiera source code
COPY src ./src

# Bygg TypeScript
RUN npm run build

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
