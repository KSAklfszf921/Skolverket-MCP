# Skolverket MCP Server

En [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server som ger AI-assistenter tillgång till Skolverkets officiella API:er. Gör det möjligt för ChatGPT, Claude och andra AI-system att hämta information om svenska läroplaner, skolenheter och utbildningar.

## 🚀 Snabbstart

### Live-Server (HTTP/SSE)
Servern är live-hostad på `https://skolverket-mcp.onrender.com/mcp`

**ChatGPT** (Plus/Pro/Enterprise):
```
Settings → Connectors → Developer Mode → Add MCP Server
URL: https://skolverket-mcp.onrender.com/mcp
```

**Claude Code** (HTTP Transport):
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

> **Limits**: 100GB bandbredd/månad. Vid hög belastning, använd lokal installation nedan.

---

### Lokal Installation (stdio)

#### Claude Desktop
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

#### Claude Code (CLI)
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

#### Cline/Codex (VS Code Extension)
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

#### Gemini (Google AI Studio - CLI)
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

> För fler installationsalternativ (npm global, källkod), se [INSTALLATION.md](INSTALLATION.md)

## 🌟 Funktioner

### MCP Capabilities
- **29 verktyg**: 17 för läroplaner, 4 för skolenheter, 7 för vuxenutbildning, 1 diagnostik
- **4 resources**: API-info, skoltyper, läroplanstyper, kurs/ämneskoder
- **5 prompts**: Kursanalys, läroplansversioner, vuxenutbildning, studievägledning, kursplanering

### API-integration
- **📚 Läroplan API**: Läroplaner (LGR11, GY11), ämnen, kurser, gymnasieprogram
- **🏫 Skolenhetsregistret**: Sök skolor och förskolor
- **🎓 Planned Educations**: Yrkeshögskola, SFI, Komvux

### Avancerade funktioner (v2.1.0)
- ✅ Strukturerad logging (Winston)
- ✅ Intelligent caching med TTL
- ✅ Rate limiting (max 5 samtidiga anrop)
- ✅ Runtime validation (Zod)
- ✅ Retry med exponentiell backoff
- ✅ Health check diagnostik

## 📚 Dokumentation

- **[Installation](INSTALLATION.md)** - Alla installationsalternativ (live-server, npx, npm, källkod)
- **[Konfiguration](docs/CONFIGURATION.md)** - Miljövariabler och inställningar
- **[Felsökning](docs/TROUBLESHOOTING.md)** - Health check och vanliga problem
- **[API](docs/API.md)** - Alla 29 verktyg och koder
- **[Exempel](docs/EXAMPLES.md)** - Use cases för lärare, elever, vägledare

## 🎯 Use Cases

- **Lärare**: Kursplanering, bedömning med kunskapskrav
- **Elever**: Kursval, programval, förstå betyg
- **Vägledare**: Programinformation, vägledning, sök utbildningar
- **Administratörer**: Läroplansförändringar, kursutbud
- **Forskare**: Läroplansanalys, historisk utveckling

## 🏗️ Teknisk Information

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

## Support

**Bugrapporter och feature requests**: [GitHub Issues](https://github.com/KSAklfszf921/skolverket-mcp/issues)
**Kontakt**: isak.skogstad@me.com

## Changelog

### v2.1.0 (2025-10-30)
- ✨ Resources-support (4 statiska URI:er)
- ✨ Prompts-support (5 guidade arbetsflöden)
- ✨ Strukturerad logging, caching, rate limiting, validation
- 🌐 HTTP/SSE Server för ChatGPT och Claude Code
- 🚀 Live-hostad på Render.com

### v2.0.0 (2025-01-20)
- ✨ Skolenhetsregistret och Planned Educations API
- 🔧 Refaktorerad kodstruktur

### v1.0.0 (2025-01-20)
- 🎉 Initial release med 17 läroplanverktyg

## Licens

MIT License - se [LICENSE](LICENSE) för detaljer.

Data kommer från Skolverkets öppna API:er. Denna server är inte officiellt associerad med Skolverket.

---

**Skapad för att göra svensk utbildningsdata mer tillgänglig via AI.**
