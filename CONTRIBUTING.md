# Contributing to Skolverket-MCP

Tack för ditt intresse att bidra till Skolverket-MCP! 🎉

Vi välkomnar alla typer av bidrag - från buggrapporter och dokumentationsförbättringar till nya funktioner och kodförbättringar.

## 🌍 Language / Språk

- **Code, commits, and documentation:** English
- **Issues and discussions:** Swedish or English (both welcome!)
- **README:** Swedish (med engelska technical terms)

## 🚀 Snabbstart

### 1. Fork och Klona

```bash
# Fork repot på GitHub, sedan:
git clone https://github.com/ditt-användarnamn/Skolverket-MCP.git
cd Skolverket-MCP
```

### 2. Installera Dependencies

```bash
npm install
```

### 3. Bygg Projektet

```bash
npm run build
```

### 4. Testa Lokalt

```bash
# Kör MCP-servern lokalt
node dist/index.js

# Eller testa med Claude Code
claude mcp add skolverket-dev node /absolut/sökväg/till/dist/index.js
```

## 📝 Typer av Bidrag

### 🐛 Buggrapporter

**Innan du rapporterar en bugg:**
- Kolla [befintliga issues](https://github.com/KSAklfszf921/Skolverket-MCP/issues)
- Testa med senaste versionen
- Försök isolera problemet

**När du skapar en issue:**
- Använd en tydlig, beskrivande titel
- Beskriv stegen för att reproducera buggen
- Beskriv förväntat vs faktiskt resultat
- Inkludera loggar, felmeddelanden, screenshots om relevant
- Ange din miljö (OS, Node version, MCP client)

### ✨ Feature Requests

Vi älskar nya idéer! När du föreslår en feature:
- Förklara **varför** denna feature behövs
- Ge exempel på **hur** den skulle användas
- Diskutera i [Discussions](https://github.com/KSAklfszf921/Skolverket-MCP/discussions) först för större features

### 📚 Dokumentation

Hjälp oss förbättra dokumentationen:
- Rätta stavfel eller grammatiska fel
- Förtydliga instruktioner
- Lägg till exempel och use cases
- Översätt till fler språk

### 💻 Kodbidrag

## 🔧 Development Workflow

### 1. Skapa en Branch

```bash
git checkout -b feature/din-feature-namn
# eller
git checkout -b fix/bug-beskrivning
```

**Branch naming:**
- `feature/` - Nya features
- `fix/` - Buggfixar
- `docs/` - Dokumentation
- `refactor/` - Kod-refactoring
- `test/` - Tester

### 2. Gör Dina Ändringar

**Kodstandard:**
- Följ befintlig kodstil
- Använd TypeScript för ny kod
- Lägg till JSDoc-kommentarer för publika funktioner
- Håll funktioner små och fokuserade

**Testing:**
```bash
# Kör tester (när de finns)
npm test

# Type check
npm run build

# Test lokalt med MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### 3. Commit

Följ [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: lägg till nytt verktyg för att söka betygsstatistik"
git commit -m "fix: rätta timeout-problem i API-anrop"
git commit -m "docs: uppdatera installation instructions"
```

**Commit types:**
- `feat:` - Ny feature
- `fix:` - Buggfix
- `docs:` - Dokumentation
- `refactor:` - Kod-refactoring
- `test:` - Lägg till eller uppdatera tester
- `chore:` - Maintenance tasks

### 4. Push och Skapa Pull Request

```bash
git push origin feature/din-feature-namn
```

Gå till GitHub och skapa en Pull Request.

## 📋 Pull Request Guidelines

### Checklista

- [ ] Koden följer projektets kodstil
- [ ] Commits följer Conventional Commits format
- [ ] Dokumentation uppdaterad (om relevant)
- [ ] Tester lagda till/uppdaterade (om relevant)
- [ ] Build passerar (`npm run build`)
- [ ] Ingen känslig information (API keys, lösenord) i koden

### PR Beskrivning

Din PR bör innehålla:
- **Vad:** Kort sammanfattning av ändringarna
- **Varför:** Förklara varför denna ändring behövs
- **Hur:** Beskriv din implementation approach
- **Testing:** Hur du testat ändringarna
- **Screenshots:** Om UI-ändringar

**Exempel:**

```markdown
## Vad
Lägger till nytt verktyg för att söka betygsstatistik per kommun

## Varför
Användare behöver kunna analysera betygsdata geografiskt

## Hur
- Implementerar `search_grade_statistics` verktyg
- Lägger till kommun-parameter i API-client
- Uppdaterar dokumentation med exempel

## Testing
- Testat med Claude Code lokalt
- Verifierat mot Skolverkets API
- Lagt till unit tests

## Related Issues
Closes #42
```

## 🏗️ Projektstruktur

```
Skolverket-MCP/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── config.ts             # Configuration
│   ├── logger.ts             # Logging utilities
│   ├── cache.ts              # Caching layer
│   ├── api/                  # API clients
│   │   ├── base-client.ts
│   │   ├── syllabus-client.ts
│   │   ├── school-units-client.ts
│   │   └── planned-education-client.ts
│   ├── tools/                # MCP tools
│   │   ├── syllabus/
│   │   ├── school-units/
│   │   └── planned-education/
│   └── types/                # TypeScript types
├── docs/                     # Documentation
├── public/                   # Static assets
└── tests/                    # Tests (future)
```

## 🧪 Lägga Till Nya Verktyg

Exempel på hur man lägger till ett nytt MCP-verktyg:

```typescript
// src/tools/syllabus/new-tool.ts
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

const NewToolSchema = z.object({
  parameter: z.string().describe('Beskrivning av parameter'),
});

export const newTool = {
  name: 'new_tool_name',
  description: 'Beskrivning av vad verktyget gör',
  inputSchema: zodToJsonSchema(NewToolSchema),
};

export async function handleNewTool(args: z.infer<typeof NewToolSchema>) {
  // Implementation
  const result = await apiClient.fetchData(args.parameter);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}
```

## 📞 Kommunikation

- **GitHub Issues:** Buggrapporter och feature requests
- **GitHub Discussions:** Allmänna diskussioner och frågor
- **Email:** isak.skogstad@me.com för privata meddelanden
- **X/Twitter:** [@isakskogstad](https://x.com/isakskogstad)

## 📜 Code of Conduct

Vi förväntar oss att alla bidragsgivare:
- Är respektfulla och inkluderande
- Accepterar konstruktiv kritik
- Fokuserar på vad som är bäst för communityt
- Visar empati mot andra community-medlemmar

## 🎓 Lär Dig Mer

- [Model Context Protocol (MCP) Docs](https://modelcontextprotocol.io/)
- [Skolverkets API Documentation](https://api.skolverket.se/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🙏 Tack!

Varje bidrag, stort som litet, hjälper till att göra Skolverket-MCP bättre för alla. Tack för att du är med och bidrar!

---

**Frågor?** Öppna en [Discussion](https://github.com/KSAklfszf921/Skolverket-MCP/discussions) eller skicka ett mail!
