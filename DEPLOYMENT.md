# Deployment Guide - Skolverket MCP Server

Denna guide visar hur du deployer skolverket-mcp som en HTTP/SSE server så att den kan användas från webbaserade AI-chatbotar.

## 🚀 Snabbstart - Lokal HTTP Server

```bash
# Bygg projektet
npm run build

# Starta HTTP server
npm run start:http
```

Servern startar på `http://localhost:3000`

### Endpoints

- **Health check**: `GET http://localhost:3000/health`
- **Lista verktyg**: `GET http://localhost:3000/tools`
- **SSE stream**: `GET http://localhost:3000/sse`
- **Kör verktyg**: `POST http://localhost:3000/execute`

### Testa lokalt

```bash
# Health check
curl http://localhost:3000/health

# Lista verktyg
curl http://localhost:3000/tools

# Kör health_check verktyget
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "health_check", "arguments": {"includeApiTests": true}}'
```

## ☁️ Deploya till Railway

Railway är en enkel plattform för att deploya servrar. Gratis tier inkluderar $5/månad i credits.

### Steg 1: Skapa Railway-konto

1. Gå till [railway.app](https://railway.app)
2. Logga in med GitHub

### Steg 2: Deploya från GitHub

```bash
# Pusha till GitHub (redan gjort)
git push origin master
```

1. Gå till Railway dashboard
2. Klicka "New Project"
3. Välj "Deploy from GitHub repo"
4. Välj `KSAklfszf921/skolverket-syllabus-mcp`
5. Railway detekterar automatiskt Dockerfile
6. Klicka "Deploy"

### Steg 3: Konfigurera miljövariabler (valfritt)

I Railway dashboard:
1. Gå till ditt projekt
2. Klicka "Variables"
3. Lägg till:
   ```
   LOG_LEVEL=info
   SKOLVERKET_API_TIMEOUT_MS=30000
   SKOLVERKET_MAX_RETRIES=3
   ```

### Steg 4: Få din publika URL

1. Railway genererar automatiskt en URL
2. Den ser ut som: `https://skolverket-mcp-production.up.railway.app`
3. Testa: `curl https://din-url.railway.app/health`

## ☁️ Deploya till Render

Render erbjuder också gratis hosting.

### Steg 1: Skapa Render-konto

1. Gå till [render.com](https://render.com)
2. Logga in med GitHub

### Steg 2: Skapa Web Service

1. Klicka "New +" → "Web Service"
2. Välj `skolverket-syllabus-mcp` repo
3. Konfigurera:
   - **Name**: `skolverket-mcp`
   - **Environment**: `Docker`
   - **Plan**: `Free`
4. Klicka "Create Web Service"

### Steg 3: Konfigurera miljövariabler

Under "Environment":
```
LOG_LEVEL=info
SKOLVERKET_API_TIMEOUT_MS=30000
SKOLVERKET_MAX_RETRIES=3
```

## 🐳 Deploya med Docker

### Bygga Docker image

```bash
# Bygga image
docker build -t skolverket-mcp .

# Kör lokalt
docker run -p 3000:3000 skolverket-mcp

# Testa
curl http://localhost:3000/health
```

### Med environment variables

```bash
docker run -p 3000:3000 \
  -e LOG_LEVEL=debug \
  -e SKOLVERKET_API_TIMEOUT_MS=60000 \
  -e SKOLVERKET_MAX_RETRIES=5 \
  skolverket-mcp
```

### Pusha till Docker Hub

```bash
# Login
docker login

# Tag image
docker tag skolverket-mcp your-username/skolverket-mcp:latest

# Push
docker push your-username/skolverket-mcp:latest
```

## 🌐 Använda i Webbaserad Chatbot

### För allgot.se AI Chatbot

När servern är deployad, använd URL:en i din chatbot-konfiguration:

```javascript
// Exempel konfiguration
{
  "mcpServers": [
    {
      "name": "skolverket",
      "url": "https://din-url.railway.app",
      "transport": "http",
      "endpoints": {
        "tools": "/tools",
        "execute": "/execute",
        "health": "/health"
      }
    }
  ]
}
```

### API Endpoints för Chatbot

**Lista verktyg:**
```
GET https://din-url.railway.app/tools
```

**Kör verktyg:**
```
POST https://din-url.railway.app/execute
Content-Type: application/json

{
  "tool": "health_check",
  "arguments": {
    "includeApiTests": true
  }
}
```

**Response format:**
```json
{
  "success": true,
  "tool": "health_check",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{...}"
      }
    ]
  },
  "requestId": "uuid",
  "timestamp": "2025-10-30T..."
}
```

## 🔒 Säkerhet

### API Keys (valfritt)

Om du vill begränsa åtkomst, lägg till authentication middleware:

```typescript
// I http-server.ts
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

Sätt miljövariabel:
```
API_KEY=your-secret-key
```

### CORS

CORS är aktiverat som default. För att begränsa till specifika domäner:

```bash
# Sätt miljövariabel
ALLOWED_ORIGINS=https://allgot.se,https://ny.allgot.se
```

## 📊 Monitoring

### Health Check

Övervaka servern med health endpoint:

```bash
# Kontinuerlig monitoring
watch -n 30 'curl -s https://din-url.railway.app/health | jq'
```

### Logs

**Railway:**
- Gå till projekt → "Deployments" → Välj deployment → "Logs"

**Render:**
- Gå till service → "Logs" tab

**Docker:**
```bash
docker logs -f container-id
```

## 🐛 Felsökning

### Problem: Container startar inte

**Lösning:**
```bash
# Testa lokalt först
docker build -t skolverket-mcp .
docker run -p 3000:3000 skolverket-mcp

# Kolla logs
docker logs container-id
```

### Problem: API anrop timeout

**Lösning:**
```bash
# Öka timeout
SKOLVERKET_API_TIMEOUT_MS=60000
SKOLVERKET_MAX_RETRIES=5
```

### Problem: Memory issues

**Lösning:**
```bash
# Öka Node memory limit
NODE_OPTIONS=--max-old-space-size=512
```

## 💰 Kostnader

### Railway (Rekommenderat)
- **Free tier**: $5/månad i credits
- **Estimerad användning**: ~$3-5/månad för låg-medium trafik
- **Hobby plan**: $5/månad för unlimited deployments

### Render
- **Free tier**: 750 timmar/månad (tillräckligt för en service)
- **Begränsningar**:
  - Spinnar ner efter 15 min inaktivitet
  - Tar 30s att starta igen
- **Starter plan**: $7/månad för always-on

### Rekommendation

**För produktion på allgot.se**: Railway Hobby ($5/mån)
- Alltid aktiv
- Snabbare än Render free tier
- Bättre logs och monitoring

## 📚 Mer Information

- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs
- Docker docs: https://docs.docker.com
