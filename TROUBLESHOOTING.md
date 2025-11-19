# Felsökningsguide för Skolverket MCP

Denna guide hjälper dig felsöka och lösa vanliga problem med Skolverket MCP-servern.

## Problem: "Kan inte ansluta till servern"

### Symptom
- MCP-klienten kan inte ansluta till servern
- Timeout-fel eller connection refused
- "Access denied" från remote servern

### Lösning 1: Bygg projektet

Om du kör servern lokalt måste TypeScript-koden först kompileras:

```bash
# Installera dependencies och bygg projektet
npm install
npm run build
```

Detta skapar `dist`-mappen med kompilerad JavaScript-kod.

### Lösning 2: Verifiera att servern körs

**För lokal HTTP-server:**
```bash
# Starta HTTP-servern
npm run start:http

# I ett nytt terminalfönster, testa health endpoint
curl http://localhost:3000/health
```

**För lokal streamable HTTP-server (standard för Render):**
```bash
# Starta streamable HTTP-servern
npm run start:streamable

# Testa health endpoint
curl http://localhost:3000/health
```

**För stdio-transport (Claude Desktop, Claude Code):**
```bash
# Kör direkt via node
node dist/index.js
```

### Lösning 3: Använd lokal server istället för remote

Om remote servern på Render inte fungerar, kör servern lokalt:

#### För Claude Code:
```bash
# stdio-transport
claude mcp add skolverket node /absolut/sökväg/till/Skolverket-MCP/dist/index.js

# ELLER HTTP-transport (kör först: npm run start:http)
claude mcp add --transport http skolverket http://localhost:3000/sse
```

#### För Claude Desktop:

**stdio-transport (rekommenderat för lokal):**
Redigera config (`Settings` → `Developer` → `Edit Config`):
```json
{
  "mcpServers": {
    "skolverket": {
      "command": "node",
      "args": ["/absolut/sökväg/till/Skolverket-MCP/dist/index.js"]
    }
  }
}
```

**HTTP-transport:**
```json
{
  "mcpServers": {
    "skolverket": {
      "url": "http://localhost:3000/mcp",
      "transport": "http"
    }
  }
}
```

## Problem: "Module not found" eller andra import-fel

### Symptom
- Fel vid körning om saknade moduler
- Cannot find module errors

### Lösning

```bash
# Rensa node_modules och package-lock
rm -rf node_modules package-lock.json

# Installera på nytt
npm install

# Bygg projektet
npm run build
```

## Problem: Remote servern (Render) svarar "Access denied"

### Symptom
- `curl https://skolverket-mcp.onrender.com/health` returnerar "Access denied"
- Kan inte ansluta från MCP-klienter till Render-URLen

### Möjliga orsaker
1. Render free tier kan ha begränsningar eller ha stängt ner servern
2. WAF (Web Application Firewall) blockerar förfrågningar
3. Servern kan ha pausats på grund av inaktivitet (Render free tier)

### Lösning

**Alternativ 1:** Kör servern lokalt (se ovan)

**Alternativ 2:** Deploya din egen instans på Render:

1. Forka detta repo
2. Skapa ett nytt projekt på [render.com](https://render.com)
3. Anslut ditt forkade repo
4. Render detekterar automatiskt `render.yaml` och deployer

**Alternativ 3:** Vänta 30-60 sekunder och försök igen (Render free tier kan ta tid att starta)

## Problem: TypeScript-kompileringsfel

### Symptom
- `npm run build` ger fel
- TypeScript errors

### Lösning

```bash
# Kontrollera TypeScript-versionen
npx tsc --version

# Installera rätt version
npm install typescript@^5.7.2 --save-dev

# Kör lint för att se alla fel
npm run lint

# Bygg projektet
npm run build
```

## Verifiera installation

### Checklista:
- [ ] `dist`-mappen finns och innehåller .js-filer
- [ ] `npm run build` fungerar utan fel
- [ ] Health check returnerar "healthy"
- [ ] MCP-klienten kan lista verktyg

### Testa installation:

```bash
# 1. Bygg projektet
npm run build

# 2. Starta servern (välj EN av dessa):
npm run start              # stdio-transport
npm run start:http         # HTTP med SSE
npm run start:streamable   # Streamable HTTP (som Render)

# 3. Testa health (endast för HTTP-varianter)
curl http://localhost:3000/health

# Förväntat svar:
# {
#   "status": "healthy",
#   "server": "skolverket-mcp",
#   "version": "2.1.3",
#   "transport": "..."
# }
```

## Debug-tips

### Aktivera verbose logging

Lägg till i environment eller .env:
```bash
LOG_LEVEL=debug
```

### Kontrollera portar

```bash
# Se vilka portar som används
lsof -i :3000

# Eller på Windows
netstat -ano | findstr :3000
```

### Testa API:erna direkt

Servern ansluter till Skolverkets öppna API:er. Testa dem direkt:

```bash
# Läroplan API
curl https://api.skolverket.se/syllabus/v1/subject-types

# Skolenhetsregistret
curl https://api.skolverket.se/skolenhetsregistret/v1/enheter

# Planned Educations
curl https://api.skolverket.se/planned-educations/v1/education-areas
```

## Fortfarande problem?

1. Kolla [GitHub Issues](https://github.com/KSAklfszf921/Skolverket-MCP/issues)
2. Skapa ett nytt issue med:
   - Node.js version (`node --version`)
   - NPM version (`npm --version`)
   - OS information
   - Exakt felmeddelande
   - Hur du försöker ansluta (stdio, HTTP, etc.)
3. Kontakta: isak.skogstad@me.com
