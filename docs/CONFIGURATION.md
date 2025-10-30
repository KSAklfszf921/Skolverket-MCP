# Konfiguration

## Miljövariabler

Skolverket MCP Server kan konfigureras via miljövariabler. Skapa en `.env` fil i projektets rot eller sätt miljövariabler i din shell:

```bash
# API Endpoints (override för testning eller alternativa endpoints)
SKOLVERKET_SYLLABUS_API_URL=https://api.skolverket.se/syllabus
SKOLVERKET_SCHOOL_UNITS_API_URL=https://api.skolverket.se/skolenhetsregistret/v2
SKOLVERKET_PLANNED_EDUCATION_API_URL=https://api.skolverket.se/planned-educations

# API Authentication (om Skolverket skulle kräva API-nyckel)
SKOLVERKET_API_KEY=your_api_key_here
SKOLVERKET_AUTH_HEADER=Authorization

# HTTP Client Settings
SKOLVERKET_API_TIMEOUT_MS=30000        # Timeout i millisekunder (default: 30000)
SKOLVERKET_MAX_RETRIES=3               # Max antal retry-försök (default: 3)
SKOLVERKET_RETRY_DELAY_MS=1000         # Bas-delay mellan retries (default: 1000)
SKOLVERKET_CONCURRENCY=5               # Max samtidiga requests (default: 5)

# Features
SKOLVERKET_ENABLE_MOCK=false           # Mock mode för testning (default: false)
SKOLVERKET_ENABLE_CACHE=true           # Cache aktiverad (default: true)

# Logging
LOG_LEVEL=info                         # error, warn, info, debug (default: info)
```

## Konfigurera i Claude Desktop

För att använda miljövariabler i Claude Desktop, lägg till dem i config:

```json
{
  "mcpServers": {
    "skolverket": {
      "command": "node",
      "args": ["/sökväg/till/skolverket-mcp/dist/index.js"],
      "env": {
        "LOG_LEVEL": "debug",
        "SKOLVERKET_MAX_RETRIES": "5",
        "SKOLVERKET_API_TIMEOUT_MS": "60000"
      }
    }
  }
}
```

## Logging

Loggar sparas i `logs/` mappen:
- `error.log` - Endast fel
- `combined.log` - Alla loggnivåer
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

För detaljerad loggning:

```bash
LOG_LEVEL=debug node dist/index.js
```
