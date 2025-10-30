# Skolverket Syllabus MCP Server

En [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server som ger LLMs tillgång till Skolverkets öppna Läroplan API. Med denna server kan Claude och andra LLMs söka, läsa och analysera svenska läroplaner, kurser, ämnen och program.

## Funktioner

### Verktyg för Ämnen
- `search_subjects` - Sök efter ämnen med filter för skoltyp, tidsperiod och läroplanstyp
- `get_subject_details` - Hämta fullständig information om ett ämne
- `get_subject_versions` - Se historiska versioner av ett ämne

### Verktyg för Kurser
- `search_courses` - Sök kurser med filter för skoltyp, ämne och tidsperiod
- `get_course_details` - Hämta detaljerad kursinformation inklusive poäng och kunskapskrav
- `get_course_versions` - Se historiska versioner av en kurs

### Verktyg för Program
- `search_programs` - Sök gymnasieprogram och andra studievägar
- `get_program_details` - Hämta programinformation med inriktningar och profiler
- `get_program_versions` - Se historiska versioner av ett program

### Verktyg för Läroplaner
- `search_curriculums` - Sök läroplaner (t.ex. LGR11, GY11)
- `get_curriculum_details` - Hämta fullständig läroplan med alla avsnitt
- `get_curriculum_versions` - Se historiska versioner av en läroplan

### Hjälpverktyg
- `get_school_types` - Lista alla skoltyper (GR, GY, etc.)
- `get_types_of_syllabus` - Lista läroplanstyper
- `get_subject_and_course_codes` - Hämta alla ämnes- och kurskoder
- `get_study_path_codes` - Hämta programkoder
- `get_api_info` - API-information

## Installation

### Snabbstart med npx (rekommenderat)

```json
{
  "mcpServers": {
    "skolverket": {
      "command": "npx",
      "args": ["-y", "skolverket-syllabus-mcp"]
    }
  }
}
```

### Installation via npm

```bash
npm install -g skolverket-syllabus-mcp
```

Lägg sedan till i Claude Desktop config:

```json
{
  "mcpServers": {
    "skolverket": {
      "command": "skolverket-syllabus-mcp"
    }
  }
}
```

### Manuell installation från källkod

```bash
git clone https://github.com/[ditt-användarnamn]/skolverket-syllabus-mcp.git
cd skolverket-syllabus-mcp
npm install
npm run build
```

Lägg till i Claude Desktop config:

```json
{
  "mcpServers": {
    "skolverket": {
      "command": "node",
      "args": ["/sökväg/till/skolverket-syllabus-mcp/dist/index.js"]
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

### Exempel på användning

När servern är konfigurerad kan du ställa frågor till Claude som:

**Ämnen och kurser:**
- "Visa alla gymnasiekurser i matematik"
- "Vad är kunskapskraven för Matematik 1c?"
- "Jämför centralt innehåll i Svenska 1 och Svenska 2"

**Program:**
- "Vilka inriktningar finns på Teknikprogrammet?"
- "Lista alla gymnasieprogram inom naturvetenskap"
- "Vad är yrkesutfallen för Vård- och omsorgsprogrammet?"

**Läroplaner:**
- "Hämta innehållet från LGR11 (Läroplan för grundskolan 2011)"
- "Visa historiska ändringar i gymnasieskolans läroplan"
- "Vilka läroplaner finns för grundskolan?"

**Referensdata:**
- "Lista alla skoltyper i Sverige"
- "Vilka ämnen finns i grundskolan?"
- "Ge mig alla kurskoder för svenska språket"

## Vanliga Skoltyper och Koder

### Skoltyper
- `GR` - Grundskolan
- `GY` - Gymnasieskolan
- `VUX` - Vuxenutbildning
- `GRSÄR` - Grundsärskolan
- `GYSÄR` - Gymnasiesärskolan

### Exempel på Ämnes- och Kurskoder
- `GRGRMAT01` - Matematik i grundskolan
- `MATMAT01a` - Matematik 1a (gymnasiet)
- `MATMAT01b` - Matematik 1b (gymnasiet)
- `MATMAT01c` - Matematik 1c (gymnasiet)
- `GRGRSVE01` - Svenska i grundskolan
- `SVESVE01` - Svenska 1 (gymnasiet)

### Exempel på Programkoder
- `NA` - Naturvetenskapsprogrammet
- `TE` - Teknikprogrammet
- `EK` - Ekonomiprogrammet
- `SA` - Samhällsvetenskapsprogrammet
- `VO` - Vård- och omsorgsprogrammet

## Teknisk Information

### Arkitektur

Projektet är byggt med TypeScript och använder:
- `@modelcontextprotocol/sdk` - MCP SDK för server-implementation
- `axios` - HTTP-klient för API-anrop
- `zod` - Schema-validering för verktygsparametrar

### Projektstruktur

```
skolverket-syllabus-mcp/
├── src/
│   ├── index.ts              # Huvudserver
│   ├── api/
│   │   └── client.ts         # Skolverket API-klient
│   ├── tools/
│   │   ├── subjects.ts       # Ämnesverktyg
│   │   ├── courses.ts        # Kursverktyg
│   │   ├── programs.ts       # Programverktyg
│   │   ├── curriculums.ts    # Läroplansverktyg
│   │   └── valuestore.ts     # Hjälpverktyg
│   └── types/
│       └── skolverket.ts     # TypeScript-typer
├── dist/                     # Kompilerad JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### API-dokumentation

Servern använder Skolverkets officiella Läroplan API:
- **Bas-URL**: `https://api.skolverket.se/syllabus`
- **Version**: v1
- **Dokumentation**: https://api.skolverket.se/syllabus/swagger-ui/index.html

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

Detta startar TypeScript i watch-läge och kompilerar om vid ändringar.

### Testning lokalt

För att testa servern lokalt kan du använda MCP Inspector:

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

Data kommer från Skolverkets öppna API. Denna MCP server är inte officiellt associerad med Skolverket.

## Support

För bugrapporter och feature requests, öppna ett issue på GitHub:
https://github.com/[ditt-användarnamn]/skolverket-syllabus-mcp/issues

## Changelog

### v1.0.0 (2025-01-20)
- Initial release
- 17 verktyg för att interagera med Skolverkets API
- Stöd för ämnen, kurser, program och läroplaner
- Versionshantering för historiska läroplaner
- Hjälpverktyg för referensdata

## Relaterade Projekt

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Skolverkets API-dokumentation](https://api.skolverket.se/syllabus/swagger-ui/index.html)
- [Claude Desktop](https://claude.ai/download)

## Författare

Skapat för att göra svenska läroplaner mer tillgängliga via LLMs.
