# Skolverket MCP Server

En [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server som ger AI-assistenter tillgång till alla Skolverkets officiella API:er. Servern möjliggör integration med verktyg som ChatGPT, Claude, och andra MCP-kompatibla AI-system för att hämta information om svenska läroplaner, skolenheter och utbildningar.

## 🌐 Live Server (Render.com)

**Servern är live-hostad och redo att användas:**
- 🔗 **URL**: [https://skolverket-mcp.onrender.com/](https://skolverket-mcp.onrender.com/)
- 📊 **Status**: Production-ready
- 🚀 **Plan**: Render.com Starter ($7/månad, 100GB bandbredd)

### Snabbstart för ChatGPT (Plus/Pro/Enterprise)
```
1. Settings → Connectors → Developer Mode
2. Add MCP Server: https://skolverket-mcp.onrender.com/mcp
```

### Snabbstart för Claude Code (HTTP Transport)
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

> **OBS**: Render.com Starter-planen har 100GB bandbredd/månad. För egen installation, se [Installation](#installation) nedan.



## 🌟 Funktioner

### 🔧 MCP Capabilities (Ny i v2.1.0)

#### 🛠️ Tools (28 verktyg)
- **17 verktyg** för Läroplan API
- **4 verktyg** för Skolenhetsregistret
- **6 verktyg** för Planned Educations API
- **1 verktyg** för diagnostik och health check

#### 📚 Resources (4 resurser) - Ny i v2.1.0
Statiska datakällor för snabb kontextinläsning:
- `skolverket://api/info` - API-information och metadata
- `skolverket://school-types` - Kompletta skoltyper (aktiva + utgångna)
- `skolverket://types-of-syllabus` - Läroplanstyper och kategorier
- `skolverket://subject-course-codes` - Alla ämnes- och kurskoder

#### 💡 Prompts (5 guider) - Ny i v2.1.0
Guidade arbetsflöden för vanliga uppgifter:
- `analyze_course` - Steg-för-steg kursanalys
- `compare_curriculum_versions` - Jämför läroplansversioner
- `find_adult_education` - Hitta vuxenutbildningar
- `plan_study_path` - Studievägledning för elever
- `teacher_course_planning` - Kursplanering för lärare

### 📚 Läroplan API (Syllabus API)
- Sök och hämta läroplaner (LGR11, GY11, etc.)
- Ämnen och kurser med kunskapskrav
- Gymnasieprogram med inriktningar och yrkesutfall
- Versionshistorik för alla läroplaner

### 🏫 Skolenhetsregistret API
- Sök efter skolenheter (skolor, förskolor, gymnasier)
- Filtrera efter status (aktiva, nedlagda, vilande)
- Hämta skolenhetskoder och grundläggande information

### 🎓 Planned Educations API
- **Vuxenutbildning**: Yrkeshögskola, SFI, Komvux
- **Utbildningstillfällen**: Planerade utbildningar med start-datum och platser
- **Statistik**: Skolstatistik per enhet och kommun
- **Kvalitetsdata**: Inspektionsrapporter och skolenkäter
- **Stöddata**: Utbildningsområden och inriktningar

## Installation

### Snabbstart med npx (rekommenderat)

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

## Användning

### Konfigurera Claude Desktop

1. Öppna Claude Desktop
2. Gå till inställningar (Settings)
3. Navigera till "Developer" → "Edit Config"
4. Lägg till server-konfigurationen ovan
5. Starta om Claude Desktop

## ⚙️ Konfiguration

### Miljövariabler

Skolverket MCP Server kan konfigureras via miljövariabler för att anpassa beteende och hantera potentiella anslutningsproblem. Skapa en `.env` fil i projektets rot eller sätt miljövariabler i din shell:

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

### Konfigurera i Claude Desktop

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

## 🔍 Felsökning och Diagnostik

### Health Check Verktyg

Använd `health_check` verktyget för att diagnosticera problem:

\`\`\`
Claude, kör health_check för att testa API-anslutningarna.
\`\`\`

Detta verktyg kontrollerar:
- ✅ Anslutning till alla tre Skolverkets API:er
- ⏱️ Response-tider (latency)
- 🔧 Konfigurationsstatus (cache, mock mode, retry-inställningar)
- 💡 Rekommendationer vid problem

### Vanliga Problem och Lösningar

#### Problem: "Could not reach the API"

**Orsak**: Nätverksfel eller felaktig URL

**Lösning**:
```bash
# Öka timeout
SKOLVERKET_API_TIMEOUT_MS=60000

# Öka antal retries
SKOLVERKET_MAX_RETRIES=5
```

#### Problem: "API authentication failed"

**Orsak**: Om Skolverket skulle börja kräva API-nyckel

**Lösning**:
```bash
SKOLVERKET_API_KEY=your_api_key
```

#### Problem: "API rate limit reached"

**Orsak**: För många requests

**Lösning**:
```bash
# Minska samtidiga requests
SKOLVERKET_CONCURRENCY=2

# Aktivera cache
SKOLVERKET_ENABLE_CACHE=true
```

#### Problem: Långsamma svar

**Lösning**:
```bash
# Aktivera cache (rekommenderat)
SKOLVERKET_ENABLE_CACHE=true

# Kör health_check för att se latency
# Överväg att öka timeout om nödvändigt
SKOLVERKET_API_TIMEOUT_MS=60000
```

### Debug Mode

För detaljerad loggning:

```bash
LOG_LEVEL=debug node dist/index.js
```

Loggar sparas i `logs/` mappen:
- `error.log` - Endast fel
- `combined.log` - Alla loggnivåer
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

### Förbättringar i v2.1.0

- ✅ **Retry med exponentiell backoff**: Automatiska omförsök vid tillfälliga fel
- ✅ **Förbättrad felhantering**: Tydliga felkoder (AUTH_REQUIRED, TRANSIENT_ERROR, etc.)
- ✅ **Request tracing**: Varje request får unikt ID för felsökning
- ✅ **Health check verktyg**: Diagnosticera API-problem direkt
- ✅ **Konfigurerbar timeout & retry**: Anpassa för din miljö
- ✅ **Rate limiting**: Respekterar API-gränser automatiskt

## 📋 Alla Verktyg

### Läroplan API (17 verktyg)

#### Ämnen
- `search_subjects` - Sök ämnen med filter
- `get_subject_details` - Hämta fullständig ämnesinformation
- `get_subject_versions` - Se historiska versioner

#### Kurser
- `search_courses` - Sök kurser med omfattande filter
- `get_course_details` - Detaljerad kursinformation med kunskapskrav
- `get_course_versions` - Historiska kursversioner

#### Program
- `search_programs` - Sök gymnasieprogram
- `get_program_details` - Programinformation med inriktningar
- `get_program_versions` - Programversioner över tid

#### Läroplaner
- `search_curriculums` - Sök läroplaner (LGR11, GY11, etc.)
- `get_curriculum_details` - Fullständig läroplan
- `get_curriculum_versions` - Läroplansversioner

#### Stöddata
- `get_school_types` - Lista skoltyper
- `get_types_of_syllabus` - Lista läroplanstyper
- `get_subject_and_course_codes` - Alla ämnes- och kurskoder
- `get_study_path_codes` - Studievägskodar
- `get_api_info` - API-information

### Skolenhetsregistret API (4 verktyg)

- `search_school_units` - Sök skolenheter med filter
- `get_school_unit_details` - Hämta skolenhetsdetaljer
- `get_school_units_by_status` - Filtrera efter status
- `search_school_units_by_name` - Sök efter namn

### Planned Educations API (6 verktyg)

#### Vuxenutbildning
- `search_adult_education` - Sök vuxenutbildningar (YH, SFI, Komvux)
- `get_adult_education_details` - Detaljerad utbildningsinformation
- `filter_adult_education_by_distance` - Filtrera distans/campus
- `filter_adult_education_by_pace` - Filtrera efter studietakt

#### Stöddata
- `get_education_areas` - Hämta utbildningsområden
- `get_directions` - Hämta inriktningar

### Diagnostik och Health Check (1 verktyg)

- `health_check` - Testa API-anslutningar och systemstatus
  - Verifierar anslutning till alla tre Skolverkets API:er
  - Mäter response-tider (latency)
  - Visar konfigurationsstatus
  - Ger rekommendationer vid problem

## 💡 Användningsexempel

### För Elever och Föräldrar

**"Vilka yrkeshögskoleutbildningar inom IT finns i Stockholm som startar i höst?"**
```
Använder: search_adult_education
Resultat: Lista över YH-utbildningar med startdatum och antagning
```

**"Vad är kunskapskraven för betyget E i Matematik 1c?"**
```
Använder: get_course_details med kod "MATMAT01c"
Resultat: Fullständiga kunskapskrav för alla betyg
```

### För Lärare

**"Visa centralt innehåll för Svenska 2 på gymnasiet"**
```
Använder: get_course_details
Resultat: Detaljerat centralt innehåll strukturerat per område
```

**"Hitta alla aktiva skolor i Göteborg"**
```
Använder: search_school_units med filter
Resultat: Lista över aktiva skolenheter
```

### För Studie- och Yrkesvägledare

**"Vilka inriktningar finns på Naturvetenskapsprogrammet?"**
```
Använder: get_program_details med kod "NA"
Resultat: Inriktningar, profiler och yrkesutfall
```

**"Visa alla SFI-kurser med låg studietakt i Uppsala"**
```
Använder: search_adult_education med filter
Resultat: SFI-utbildningar anpassade för sökkriterierna
```

### För Forskare och Administratörer

**"Hur har läroplanen för matematik förändrats mellan 2011 och 2022?"**
```
Använder: get_subject_versions + get_subject_details
Resultat: Jämförelse mellan olika versioner
```

**"Vilka skolor har lagts ner i Stockholms län de senaste åren?"**
```
Använder: get_school_units_by_status med status "UPPHORT"
Resultat: Lista över nedlagda skolenheter
```

## 🔑 Vanliga Koder och Termer

### Skoltyper
- `GR` - Grundskolan
- `GY` - Gymnasieskolan
- `VUX` - Vuxenutbildning
- `GRSÄR` - Grundsärskolan
- `GYSÄR` - Gymnasiesärskolan

### Utbildningsformer (typeOfSchool)
- `yh` - Yrkeshögskola
- `sfi` - SFI (Svenska för invandrare)
- `komvuxgycourses` - Komvux gymnasiekurser
- `komvuxbasiccourses` - Komvux grundläggande kurser

### Exempel på Koder
- **Kurser**: `MATMAT01c` (Matematik 1c), `SVESVE01` (Svenska 1)
- **Ämnen**: `GRGRMAT01` (Matematik grundskola)
- **Program**: `NA` (Naturvetenskap), `TE` (Teknik), `EK` (Ekonomi)
- **Läroplaner**: `LGR11` (Läroplan för grundskolan 2011), `GY11` (Gymnasiet 2011)

## 🏗️ Teknisk Information

### Arkitektur

```
skolverket-mcp/
├── src/
│   ├── index.ts                    # Huvudserver med Resources & Prompts
│   ├── errors.ts                   # Custom error classes (ny i v2.1.0)
│   ├── logger.ts                   # Winston logging (ny i v2.1.0)
│   ├── cache.ts                    # In-memory cache (ny i v2.1.0)
│   ├── validator.ts                # Zod validation (ny i v2.1.0)
│   ├── api/
│   │   ├── base-client.ts          # HTTP-klient med rate limiting & caching
│   │   ├── syllabus-client.ts      # Läroplan API
│   │   ├── school-units-client.ts  # Skolenheter API
│   │   └── planned-education-client.ts # Planned Educations API
│   ├── tools/
│   │   ├── syllabus/               # Läroplanverktyg (17 st)
│   │   ├── school-units/           # Skolenhetsverktyg (4 st)
│   │   └── planned-education/      # Utbildningsverktyg (6 st)
│   └── types/
│       ├── syllabus.ts             # Läroplantyper
│       ├── school-units.ts         # Skolenhetstyper
│       └── planned-education.ts    # Utbildningstyper
├── dist/                           # Kompilerad JavaScript
├── logs/                           # Log-filer (ny i v2.1.0)
│   ├── combined.log                # Alla loggar
│   ├── error.log                   # Endast errors
│   ├── exceptions.log              # Uncaught exceptions
│   └── rejections.log              # Unhandled promise rejections
├── package.json
├── tsconfig.json
└── README.md
```

### Byggd med

- `@modelcontextprotocol/sdk` - MCP SDK
- `axios` - HTTP-klient
- `zod` - Schema-validering och runtime validation
- `winston` - Strukturerad logging (ny i v2.1.0)
- `p-limit` - Rate limiting och concurrency control (ny i v2.1.0)
- TypeScript - Type-säkerhet

### Nya Funktioner i v2.1.0

#### 🔍 Strukturerad Logging
- Winston-baserad logging med filrotation
- Separata loggar för errors och kombinerad output
- Automatisk loggning av alla API-anrop
- Debug-läge med detaljerad information

#### 💾 Intelligent Caching
- In-memory cache med TTL (Time To Live)
- Automatisk cache-rensning var 5:e minut
- Statisk data cachas i 24 timmar
- Cache-statistik tillgänglig via logger

#### 🚦 Rate Limiting
- Max 5 samtidiga API-anrop per klient
- Automatisk kö-hantering med p-limit
- Förhindrar API rate limiting
- Optimerad prestanda

#### ✅ Runtime Validation
- Zod-baserad input-validering
- Tydliga felmeddelanden på svenska
- Återanvändbara valideringsscheman
- Type-safe validering

#### 🎯 Custom Error Handling
- Hierarkisk error-struktur
- SkolverketApiError för API-fel
- ValidationError för input-fel
- ResourceNotFoundError för saknade resurser
- RateLimitError med retry-information

### API-dokumentation

Servern använder följande Skolverket API:er:
- **Läroplan API**: `https://api.skolverket.se/syllabus`
- **Skolenhetsregistret**: `https://api.skolverket.se/skolenhetsregistret/v2`
- **Planned Educations**: `https://api.skolverket.se/planned-educations` (v4)

## 🎯 Use Cases

### Lärare
- Kursplanering med centralt innehåll
- Bedömning med kunskapskrav
- Tematiskt arbete över ämnen
- Hitta närliggande skolenheter

### Elever
- Kursval och programval
- Förstå kunskapskrav och betyg
- Hitta vuxenutbildningar och vidareutbildning
- Söka yrkeshögskoleutbildningar

### Studie- och Yrkesvägledare
- Programinformation med yrkesutfall
- Vägledning om vidareutbildning
- Sök utbildningstillfällen med filter
- Jämför utbildningsalternativ

### Utbildningsadministratörer
- Läroplansförändringar över tid
- Kursutbud och planering
- Skolenhetsregister och status
- Statistik och kvalitetsdata

### Forskare
- Analys av läroplaner
- Historisk utveckling
- Skolenkätsdata
- Inspektionsrapporter

## 🆕 Version 2.1.0 - Nyheter

### 🎯 Nya MCP Capabilities
✅ **Resources** - 4 statiska resurser för snabb kontextinläsning
✅ **Prompts** - 5 guidade arbetsflöden för vanliga uppgifter
✅ **Förbättrade Tools** - Alla 27 verktyg har utökade beskrivningar med use cases

### 🔧 Nya Funktioner
✅ **Strukturerad Logging** - Winston-baserad logging med filrotation
✅ **Intelligent Caching** - In-memory cache med TTL och automatisk rensning
✅ **Rate Limiting** - Max 5 samtidiga API-anrop med p-limit
✅ **Runtime Validation** - Zod-baserad input-validering med svenska felmeddelanden
✅ **Custom Error Handling** - Hierarkisk error-struktur för bättre felhantering

### 📚 Resources
- `skolverket://api/info` - API-information
- `skolverket://school-types` - Skoltyper
- `skolverket://types-of-syllabus` - Läroplanstyper
- `skolverket://subject-course-codes` - Ämnes- och kurskoder

### 💡 Prompts
- `analyze_course` - Kursanalys
- `compare_curriculum_versions` - Versionsjämförelse
- `find_adult_education` - Hitta vuxenutbildningar
- `plan_study_path` - Studievägledning
- `teacher_course_planning` - Kursplanering

## Utveckling

### Krav
- Node.js 18 eller senare
- npm 9 eller senare

### Bygg projektet

```bash
npm install
npm run build
```

### Utvecklingsläge

```bash
npm run dev
```

### Testning lokalt

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Bidra

Bidrag är välkomna! För att bidra:

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Commita dina ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## Licens

MIT License - se [LICENSE](LICENSE) för detaljer.

## Attribution

Data kommer från Skolverkets öppna API:er. Denna MCP server är inte officiellt associerad med Skolverket.

## Support

För bugrapporter och feature requests, öppna ett issue på GitHub:
https://github.com/KSAklfszf921/skolverket-mcp/issues

**Kontakt:** isak.skogstad@me.com

## Changelog

### v2.1.0 (2025-10-30)
- ✨ **KRITISKT**: Resources-support med 4 statiska URI:er
- ✨ **KRITISKT**: Prompts-support med 5 guidade arbetsflöden
- ✨ **VIKTIGT**: Strukturerad logging med Winston (filrotation, JSON-format)
- ✨ **VIKTIGT**: Intelligent caching med TTL och automatisk rensning
- ✨ **VIKTIGT**: Rate limiting med p-limit (max 5 samtidiga anrop)
- ✨ **VIKTIGT**: Runtime validation med Zod och svenska felmeddelanden
- ✨ **VIKTIGT**: Custom error classes (SkolverketApiError, ValidationError, etc.)
- 🌐 **NYT**: HTTP/SSE Server för ChatGPT och Claude Code HTTP transport
- 🚀 **NYT**: Live-hostad på Render.com (https://skolverket-mcp.onrender.com/)
- 🔧 Förbättrade tool-beskrivningar med ANVÄNDNINGSFALL, RETURNERAR, EXEMPEL
- 🔧 Uppdaterad capabilities declaration (tools, resources, prompts, logging)
- 📝 Omfattande dokumentation av alla nya funktioner

### v2.0.0 (2025-01-20)
- ✨ Ny: Integration med Skolenhetsregistret API
- ✨ Ny: Integration med Planned Educations API
- ✨ Ny: 10 nya verktyg för vuxenutbildning och skolenheter
- 🔧 Refaktorerad kodstruktur för bättre modularitet
- 🔧 Delad base HTTP-klient för alla API:er
- 📝 Uppdaterad dokumentation och exempel

### v1.0.0 (2025-01-20)
- 🎉 Initial release
- 17 verktyg för Läroplan API
- Stöd för ämnen, kurser, program och läroplaner
- Versionshantering och historiska läroplaner

## Relaterade Projekt

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Skolverkets API-dokumentation](https://api.skolverket.se/)
- [Claude Desktop](https://claude.ai/download)

## Författare

Skapat för att göra svensk utbildningsdata mer tillgänglig via LLMs.
