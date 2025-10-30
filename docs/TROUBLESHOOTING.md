# Felsökning och Diagnostik

## Health Check Verktyg

Använd `health_check` verktyget för att diagnosticera problem:

```
Claude, kör health_check för att testa API-anslutningarna.
```

Detta verktyget kontrollerar:
- ✅ Anslutning till alla tre Skolverkets API:er
- ⏱️ Response-tider (latency)
- 🔧 Konfigurationsstatus (cache, mock mode, retry-inställningar)
- 💡 Rekommendationer vid problem

## Vanliga Problem och Lösningar

### Problem: "Could not reach the API"

**Orsak**: Nätverksfel eller felaktig URL

**Lösning**:
```bash
# Öka timeout
SKOLVERKET_API_TIMEOUT_MS=60000

# Öka antal retries
SKOLVERKET_MAX_RETRIES=5
```

### Problem: "API authentication failed"

**Orsak**: Om Skolverket skulle börja kräva API-nyckel

**Lösning**:
```bash
SKOLVERKET_API_KEY=your_api_key
```

### Problem: "API rate limit reached"

**Orsak**: För många requests

**Lösning**:
```bash
# Minska samtidiga requests
SKOLVERKET_CONCURRENCY=2

# Aktivera cache
SKOLVERKET_ENABLE_CACHE=true
```

### Problem: Långsamma svar

**Lösning**:
```bash
# Aktivera cache (rekommenderat)
SKOLVERKET_ENABLE_CACHE=true

# Kör health_check för att se latency
# Överväg att öka timeout om nödvändigt
SKOLVERKET_API_TIMEOUT_MS=60000
```

### Problem: Live-servern når bandbreddsgränsen

**Symptom**:
- Servern blir otillgänglig
- Felmeddelanden om bandbredd

**Lösning**:
- Använd lokal installation istället (se [INSTALLATION.md](../INSTALLATION.md))
- Följ installationsguiden för npx eller npm global install

## Debug Mode

För detaljerad loggning:

```bash
LOG_LEVEL=debug node dist/index.js
```

Loggar sparas i `logs/` mappen (se [CONFIGURATION.md](CONFIGURATION.md) för detaljer).

## Förbättringar i v2.1.0

- ✅ **Retry med exponentiell backoff**: Automatiska omförsök vid tillfälliga fel
- ✅ **Förbättrad felhantering**: Tydliga felkoder (AUTH_REQUIRED, TRANSIENT_ERROR, etc.)
- ✅ **Request tracing**: Varje request får unikt ID för felsökning
- ✅ **Health check verktyg**: Diagnosticera API-problem direkt
- ✅ **Konfigurerbar timeout & retry**: Anpassa för din miljö
- ✅ **Rate limiting**: Respekterar API-gränser automatiskt
