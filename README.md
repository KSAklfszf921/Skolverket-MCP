# Skolverket MCP Server

En [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server som ger AI-assistenter tillgång till **alla Skolverkets öppna API:er** – Läroplan API, Skolenhetsregistret och Planned Educations API.

Gör det möjligt för ChatGPT, Claude och andra LLM-system att hämta information om svenska läroplaner, kurser, ämnen, gymnasieprogram, skolenheter, samt vuxenutbildningar (YH, SFI, Komvux).

**Skapad av:** [Isak Skogstad](mailto:isak.skogstad@me.com) • [X/Twitter](https://x.com/isakskogstad)

---

## Live-Server

Servern körs live och kan användas direkt utan installation:

```
https://skolverket-mcp.onrender.com/mcp
```

**Tekniska specifikationer:**
- Protokoll: HTTP/SSE (Server-Sent Events)
- Bandbredd: 100GB per månad
- Tillgänglighet: 24/7
- Status: Produktionsklar

> **Obs:** Om servern når bandbreddsgränsen rekommenderas lokal installation (se nedan).

---

## Anslutningsinstruktioner

### ChatGPT (Plus/Pro/Enterprise)

**Alternativ 1: Live-Server**
```
Settings → Connectors → Developer Mode → Add MCP Server
URL: https://skolverket-mcp.onrender.com/mcp
```

**Alternativ 2: Lokal Installation**
```
ChatGPT stöder endast HTTP/SSE (använd live-servern ovan)
```

---

### Claude Desktop

**Alternativ 1: Live-Server (HTTP Transport)**
```json
{
  "mcpServers": {
    "skolverket": {
      "transport": "http",
      "url": "https://skolverket-mcp.onrender.com/mcp"
    }
  }
}
```

**Alternativ 2: Lokal Installation (stdio)**
```json
{
  "mcpServers": {
    "skolverket": {
      "command": "npx",
      "args": ["-y", "skolverket-mcp"]
    }
  }
}
```

---

### Claude Code

**Alternativ 1: Live-Server (HTTP Transport)**
```json
{
  "mcpServers": {
    "skolverket": {
      "transport": "http",
      "url": "https://skolverket-mcp.onrender.com/mcp"
    }
  }
}
```

**Alternativ 2: Lokal Installation (stdio)**
```json
{
  "mcpServers": {
    "skolverket": {
      "command": "npx",
      "args": ["-y", "skolverket-mcp"]
    }
  }
}
```

---

### OpenAI Codex (CLI)

**Alternativ 1: Live-Server (HTTP)**
```toml
# Lägg till i ~/.codex/config.toml:
[mcp.skolverket]
url = "https://skolverket-mcp.onrender.com/mcp"
```

**Alternativ 2: Lokal Installation (stdio)**
```json
{
  "mcpServers": {
    "skolverket": {
      "command": "npx",
      "args": ["-y", "skolverket-mcp"]
    }
  }
}
```

---

### Cline (VS Code Extension)

**Alternativ 1: Live-Server (HTTP)**
```json
{
  "mcpServers": {
    "skolverket": {
      "transportType": "http",
      "url": "https://skolverket-mcp.onrender.com/mcp"
    }
  }
}
```

**Alternativ 2: Lokal Installation (stdio)**
```json
{
  "mcpServers": {
    "skolverket": {
      "command": "npx",
      "args": ["-y", "skolverket-mcp"]
    }
  }
}
```

---

### Gemini CLI (Google AI Studio)

**Alternativ 1: Live-Server (HTTP)**
```bash
# Kommando:
gemini mcp add --transport http skolverket https://skolverket-mcp.onrender.com/mcp

# Eller i config:
```
```json
{
  "mcpServers": {
    "skolverket": {
      "httpUrl": "https://skolverket-mcp.onrender.com/mcp"
    }
  }
}
```

**Alternativ 2: Lokal Installation (stdio)**
```json
{
  "mcpServers": {
    "skolverket": {
      "command": "npx",
      "args": ["-y", "skolverket-mcp"]
    }
  }
}
```

---

> **Fler installationsalternativ**: [INSTALLATION.md](INSTALLATION.md) (npm global, källkod, etc.)

## Funktioner

### MCP Capabilities
Servern implementerar MCP-protokollet med stöd för:
- **29 verktyg** – 17 för läroplaner, 4 för skolenheter, 7 för vuxenutbildning, 1 för diagnostik
- **4 resurser** – API-info, skoltyper, läroplanstyper, kurs- och ämneskoder
- **5 promptmallar** – Kursanalys, versionsjämförelser, vuxenutbildning, studievägledning, kursplanering

### API-integration
Servern kopplar till tre av Skolverkets öppna API:er:

**Läroplan API**
Läroplaner (LGR11, GY11), ämnen, kurser, gymnasieprogram med kunskapskrav och centralt innehåll.

**Skolenhetsregistret**
Sök och filtrera skolor, förskolor och andra skolenheter. Inkluderar aktiva, nedlagda och vilande enheter.

**Planned Educations API**
Yrkeshögskola, SFI, Komvux och andra vuxenutbildningar med startdatum, platser och studietakt.

### Tekniska förbättringar (v2.1.0)
- Strukturerad loggning med Winston
- Intelligent cachning med TTL
- Rate limiting (max 5 samtidiga anrop)
- Input-validering med Zod
- Automatiska återförsök med exponentiell backoff
- Health check för diagnostik

## Dokumentation

- **[Installation](INSTALLATION.md)** – Alla installationsalternativ (live-server, npx, npm, källkod)
- **[Konfiguration](docs/CONFIGURATION.md)** – Miljövariabler och inställningar
- **[Felsökning](docs/TROUBLESHOOTING.md)** – Health check och vanliga problem
- **[API](docs/API.md)** – Alla 29 verktyg och koder
- **[Exempel](docs/EXAMPLES.md)** – Praktiska exempel för olika användargrupper

## Användningsområden

**För lärare**
Kursplanering med centralt innehåll, bedömning med kunskapskrav, tematiskt arbete över ämnen.

**För elever och föräldrar**
Kursval, programval, förstå betygskriterier, söka vuxenutbildningar och YH-utbildningar.

**För studie- och yrkesvägledare**
Programinformation med yrkesutfall, vägledning om vidareutbildning, söka utbildningstillfällen.

**För administratörer**
Läroplansförändringar över tid, kursutbud och planering, skolenhetsregister.

**För forskare**
Läroplansanalys, historisk utveckling, jämföra versioner.

## Teknisk Information

### Arkitektur
```
skolverket-mcp/
├── src/
│   ├── index.ts                    # Huvudserver (stdio)
│   ├── streamable-http-server.ts   # HTTP/SSE server
│   ├── api/                        # API-klienter
│   ├── tools/                      # 29 verktyg
│   └── types/                      # TypeScript-typer
├── docs/                           # Dokumentation
└── logs/                           # Loggar
```

### Byggd med
- `@modelcontextprotocol/sdk` - MCP SDK
- `axios` + `axios-retry` - HTTP-klient med retry
- `zod` - Schema-validering
- `winston` - Logging
- `p-limit` - Rate limiting
- TypeScript

## Utveckling

```bash
git clone https://github.com/KSAklfszf921/skolverket-mcp.git
cd skolverket-mcp
npm install
npm run build      # Kompilera
npm run dev        # Watch mode
npm start          # Kör stdio server
npm run start:streamable  # Kör HTTP/SSE server

# Testa lokalt
npx @modelcontextprotocol/inspector node dist/index.js
```

## Support och kontakt

Hittat en bugg eller har en idé? Öppna gärna ett [issue på GitHub](https://github.com/KSAklfszf921/skolverket-mcp/issues).

**Kontakt:** [isak.skogstad@me.com](mailto:isak.skogstad@me.com) • [X/Twitter](https://x.com/isakskogstad)

## Versionshistorik

### Version 2.1.0 (30 oktober 2025)
- Lade till Resources-support (4 statiska URI:er)
- Lade till Prompts-support (5 guidade arbetsflöden)
- Implementerade strukturerad logging, cachning, rate limiting och validering
- HTTP/SSE Server för ChatGPT och Claude Code
- Live-hostad på Render.com

### Version 2.0.0 (20 januari 2025)
- Integration med Skolenhetsregistret och Planned Educations API
- Refaktorerad kodstruktur med modulär uppbyggnad

### Version 1.0.0 (20 januari 2025)
- Första versionen med 17 verktyg för Läroplan API

## Licens och attribution

MIT License – se [LICENSE](LICENSE) för detaljer.

Data hämtas från Skolverkets öppna API:er. Denna server är inte officiellt associerad med eller godkänd av Skolverket.

---

Projektet skapades för att göra svensk utbildningsdata mer tillgänglig för AI-assistenter och forskare. Bidrag välkomnas!
