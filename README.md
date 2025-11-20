<img width="700" height="220" alt="Skolverket MCP logo" src="https://github.com/user-attachments/assets/74563bdb-eea4-4276-a58c-ec89b11806ed" />

# Skolverket MCP Server

[![Server Status](https://img.shields.io/website?url=https%3A%2F%2Fskolverket-mcp.onrender.com%2Fhealth&label=MCP%20Server&up_message=online&down_message=offline)](https://skolverket-mcp.onrender.com/health)
[![npm version](https://img.shields.io/npm/v/skolverket-mcp)](https://www.npmjs.com/package/skolverket-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-Published-brightgreen)](https://registry.modelcontextprotocol.io/servers/io.github.KSAklfszf921/skolverket-mcp)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--03--26-green)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)
[![MCP Badge](https://lobehub.com/badge/mcp-full/ksaklfszf921-skolverket-syllabus-mcp)](https://lobehub.com/mcp/ksaklfszf921-skolverket-syllabus-mcp)

En [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server som ger AI-assistenter tillgång till **alla Skolverkets öppna API:er** – Läroplan API, Skolenhetsregistret och Planned Educations API.

**Skapad av:** [Isak Skogstad](mailto:isak.skogstad@me.com) • [X/Twitter](https://x.com/isakskogstad)

---

## 🚀 Två sätt att använda

### 🌐 Remote Server (Rekommenderat)
**Hostad på Render – gratis och alltid uppdaterad**

Använd den publika servern direkt utan installation:
```
https://skolverket-mcp.onrender.com/mcp
```

✅ Ingen installation krävs
✅ Fungerar direkt i ChatGPT, Claude, Cursor, VS Code
✅ Alltid senaste versionen
✅ Kostnadsfritt

### 💻 Lokal Installation
**För utveckling eller offline-användning**

Klona och kör lokalt:
```bash
git clone https://github.com/KSAklfszf921/skolverket-mcp.git
cd skolverket-mcp
npm install && npm run build
```

✅ Full kontroll över koden
✅ Fungerar offline
✅ Perfekt för utveckling och testning

---

## 🛠️ Funktioner

MCP-servern implementerar MCP-protokollet med stöd för:
- **29 verktyg** – 17 för läroplaner, 4 för skolenheter, 7 för vuxenutbildning, 1 för diagnostik
- **4 resurser** – API-info, skoltyper, läroplanstyper, kurs- och ämneskoder
- **5 promptmallar** – Kursanalys, versionsjämförelser, vuxenutbildning, studievägledning, kursplanering

### API-integration
Servern kopplar till tre av Skolverkets öppna API:er:

**1. Syllabus API**
Läroplaner (LGR11, GY11), ämnen, kurser, gymnasieprogram med kunskapskrav och centralt innehåll.

**2. Skolenhetsregistret**
Sök och filtrera skolor, förskolor och andra skolenheter. Inkluderar aktiva, nedlagda och vilande enheter.

**3. Planned Educations API**
Yrkeshögskola, SFI, Komvux och andra vuxenutbildningar med startdatum, platser och studietakt.

---


## 📱 Snabbstart 

### Claude (Webb)



https://github.com/user-attachments/assets/f7625e91-6f42-4301-b813-51f9bfcc7ef0


**1. Gå till claude.ai:**
- Logga in på https://claude.ai

**2. Öppna inställningar:**
- Klicka på din profil (nere till vänster)
- Välj **"Settings"**

**3. Lägg till MCP-server:**
- Gå till **"Developer"** eller **"Integrations"**
- Klicka **"Add MCP Server"** eller **"Connect"**
- **Name:** `Skolverket MCP`
- **URL:** `https://skolverket-mcp.onrender.com/mcp`
- **Type:** Välj `HTTP` eller `Streamable HTTP`
- Klicka **"Connect"** eller **"Add"**

---

### Claude Desktop

**1. Öppna Claude Desktop Settings**
- **macOS:** Claude-menyn → Settings
- **Windows:** Claude-menyn → Settings

**2. Gå till Connectors:**
- Klicka på **"Connectors"** i vänstermenyn
- Klicka **"Add custom connector"**

**3. Fyll i formuläret:**
- **Name:** `Skolverket MCP`
- **Remote MCP server URL:** `https://skolverket-mcp.onrender.com/mcp`
- **Advanced settings:** Lämna OAuth-fälten **tomma**
- Klicka **"Add"**

#### Alternativ: Lokal installation 

**1. Klona och bygg:**
```bash
git clone https://github.com/KSAklfszf921/skolverket-mcp.git
cd skolverket-mcp
npm install && npm run build
```

**2. I Claude Desktop:**
- Settings → **Developer** (inte Connectors!)
- Klicka **"Edit Config"**

**3. Lägg till i JSON-filen:**
```json
{
  "mcpServers": {
    "skolverket": {
      "command": "node",
      "args": ["/absolut/sökväg/till/skolverket-mcp/dist/index.js"]
    }
  }
}
```

**4. Spara och starta om Claude Desktop**

**Notera:** Lokal installation använder stdio-transport via Developer-sektionen, inte Connectors.

---

### Claude Code

**Live-Server:**
```bash
claude mcp add --transport http skolverket https://skolverket-mcp.onrender.com/mcp
```

**Lokal (från källkod):**
```bash
# Efter git clone och npm install (se ovan)
claude mcp add skolverket node /absolut/sökväg/till/dist/index.js
```

**Verifiera:** `claude mcp list`

---

### ChatGPT 

#### I Webbläsaren (chatgpt.com)

**1. Aktivera Utvecklarläget (engångsinstallation):**
- Gå till https://chatgpt.com
- Klicka på din **profil** (nere till vänster)
- Välj **"Appar och sammanlänkningar"**
- Hitta **"Utvecklarläge" (BETA)** och aktivera den blå toggle-knappen

**2. Lägg till MCP-server:**
- I samma "Appar och sammanlänkningar"-vy
- Scrolla ner till **"Aktiva sammanlänkningar"**
- Klicka **"Ny sammanlänkning"** eller **"+"**

**3. Fyll i formuläret:**
- **Namn:** `Skolverket MCP`
- **Beskrivning:** (valfritt)
- **URL för MCP-server:** `https://skolverket-mcp.onrender.com/mcp`
- **Autentisering:** Välj **"Ingen autentisering"**
- Markera **"Jag förstår och vill fortsätta"**
- Klicka **"Skapa"**

---

### OpenAI Codex (terminal)

#### Remote Server (HTTP)

**`~/.codex/config.toml`:**
```toml
[mcp.skolverket]
url = "https://skolverket-mcp.onrender.com/mcp"
transport = "http"
```

#### Lokal Installation

**1. Klona och bygg (om ej redan gjort):**
```bash
git clone https://github.com/KSAklfszf921/skolverket-mcp.git
cd skolverket-mcp
npm install && npm run build
```

**2. Konfigurera stdio-transport:**

**`~/.codex/config.toml`:**
```toml
[mcp.skolverket]
command = "node"
args = ["/absolut/sökväg/till/skolverket-mcp/dist/index.js"]
transport = "stdio"
```

**Windows:**
```toml
[mcp.skolverket]
command = "node"
args = ["C:\\Users\\username\\skolverket-mcp\\dist\\index.js"]
transport = "stdio"
```
---

## 💡 Användningsområden


https://github.com/user-attachments/assets/8eefa26c-4162-49a5-adf0-82677a663b19


### För Lärare
- **Kursplanering:** "Jämför kunskapskraven E och A för Svenska 1 och ge förslag på bedömningsuppgifter"
- **Tematiskt arbete:** "Hitta alla kurser i gymnasiet som har hållbarhet i sitt centrala innehåll"
- **Bedömning:** "Visa alla kunskapskrav för betyg C i Biologi 1 och förklara skillnaderna mot B"

### För elever & föräldrar
- **Programval:** "Jämför Naturvetenskapsprogrammet och Teknikprogrammet - vilka kurser är obligatoriska?"
- **Kursval:** "Vilka matematikkurser finns på gymnasiet och vilka bygger på varandra?"
- **Betygskriterier:** "Vad krävs för att få A i Historia 1a1?"

### För undersökningar & analyser  
- **Skolregister:** "Hitta alla aktiva gymnasieskolor i Stockholms län"
- **Kursutbud:** "Vilka skolor erbjuder Ekonomiprogrammet i Malmö?"
- **Läroplansanalys:** "Analysera hur begreppet 'programmering' har utvecklats i läroplaner 2011-2025"

---

## 🆘 Support

**GitHub Issues:** https://github.com/KSAklfszf921/skolverket-mcp/issues
**Email:** isak.skogstad@me.com • **X:** [@isakskogstad](https://x.com/isakskogstad) 
[![MCP Badge](https://lobehub.com/badge/mcp/ksaklfszf921-skolverket-syllabus-mcp)](https://lobehub.com/mcp/ksaklfszf921-skolverket-syllabus-mcp)

---

## 📝 Licens

MIT License – Data från Skolverkets öppna API:er. Inte officiellt associerad med Skolverket.
