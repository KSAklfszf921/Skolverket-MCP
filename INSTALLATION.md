# Installation

## 🌐 Använd Live-Servern (Snabbast)

**Servern är live-hostad och redo att användas direkt:**

### För ChatGPT (Plus/Pro/Enterprise)
```
1. Settings → Connectors → Developer Mode
2. Add MCP Server: https://skolverket-mcp.onrender.com/mcp
```

### För Claude Code (HTTP Transport)
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

> **Limits**: Servern har 100GB bandbredd/månad. Vid hög belastning rekommenderas lokal installation.

---

## 📦 Lokal Installation

### Snabbstart med npx (Rekommenderat)

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

### Installation via npm

```bash
npm install -g skolverket-mcp
```

Lägg sedan till i Claude Desktop config:

```json
{
  "mcpServers": {
    "skolverket": {
      "command": "skolverket-mcp"
    }
  }
}
```

### Manuell installation från källkod

```bash
git clone https://github.com/KSAklfszf921/skolverket-mcp.git
cd skolverket-mcp
npm install
npm run build
```

Lägg till i Claude Desktop config:

```json
{
  "mcpServers": {
    "skolverket": {
      "command": "node",
      "args": ["/sökväg/till/skolverket-mcp/dist/index.js"]
    }
  }
}
```

## Konfigurera Claude Desktop

1. Öppna Claude Desktop
2. Gå till inställningar (Settings)
3. Navigera till "Developer" → "Edit Config"
4. Lägg till server-konfigurationen ovan
5. Starta om Claude Desktop

För avancerad konfiguration, se [CONFIGURATION.md](docs/CONFIGURATION.md).
