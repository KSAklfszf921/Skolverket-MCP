<img width="700" height="220" alt="Skolverket MCP logo" src="https://github.com/user-attachments/assets/74563bdb-eea4-4276-a58c-ec89b11806ed" />

# Skolverket MCP Server

[![Server Status](https://img.shields.io/website?url=https%3A%2F%2Fskolverket-mcp.onrender.com%2Fhealth&label=MCP%20Server&up_message=online&down_message=offline)](https://skolverket-mcp.onrender.com/health)
[![Version](https://img.shields.io/badge/version-2.1.0-blue)](https://github.com/KSAklfszf921/Skolverket-MCP/releases)
[![MCP Protocol](https://img.shields.io/badge/MCP-2025--03--26-green)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

En [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server som ger AI-assistenter tillgång till **alla Skolverkets öppna API:er** – Läroplan API, Skolenhetsregistret och Planned Educations API.

**Skapad av:** [Isak Skogstad](mailto:isak.skogstad@me.com) • [X/Twitter](https://x.com/isakskogstad)

---

## 🛠️ Funktioner

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

---

## ⚡ Quick Start (2 minuter)

### För ChatGPT Plus/Pro/Enterprise

1. Gå till [chatgpt.com](https://chatgpt.com) → **Profil** → **Appar och sammanlänkningar**
2. Aktivera **Utvecklarläge (BETA)**
3. Klicka **"Ny sammanlänkning"**
4. URL: `https://skolverket-mcp.onrender.com/mcp`
5. Autentisering: **Ingen autentisering**
6. Klara! Testa med: *"Visa kunskapskraven för Matematik 2a"*

### För Claude Desktop

1. Öppna **Settings** → **Connectors** → **Add custom connector**
2. URL: `https://skolverket-mcp.onrender.com/mcp`
3. Lämna OAuth-fält **tomma**
4. Klara! Testa med: *"Jämför Naturvetenskapsprogrammet och Teknikprogrammet"*

### För Claude Code (CLI)

```bash
claude mcp add --transport http skolverket https://skolverket-mcp.onrender.com/mcp
```

Testa med: *"Hitta alla yrkeshögskoleutbildningar inom AI i Stockholm"*

📚 **Fler klienter?** Se [detaljerade instruktioner nedan](#-snabbstart-per-klient).

---

## 🌐 Live-Server

```
https://skolverket-mcp.onrender.com/mcp
```

**Specifikationer:** Streamable HTTP (MCP 2025-03-26) • 100GB bandbredd/månad • Ingen autentisering

> **⚠️ VIKTIGT:** Skolverket-MCP är en öppen server utan autentisering. Lämna **ALLTID** OAuth/API-key fält **TOMMA** i alla klienter.

---

## 📱 Snabbstart per Klient

### ChatGPT (Plus/Pro/Enterprise)

**⚠️ Kräver Plus/Pro/Enterprise-prenumeration • Endast webbläsare (ej mobilapp)**

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

**4. Servern är nu tillgänglig** i alla chattar

---

### claude.ai (Webb)

**⚠️ Kräver Claude Pro eller Team-prenumeration**

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

**4. Servern är nu tillgänglig** i alla chattar

---

### Claude Desktop

#### I Appen (Enklast - Ingen terminal behövs!)

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

**4. Servern aktiveras direkt** - visas med "CUSTOM"-märke i listan

#### Alternativ: Lokal Installation (för utveckling)

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

### Cline (VS Code)

#### I VS Code (Rekommenderat)

**1. Öppna VS Code Settings**
- Cmd/Ctrl+, eller **File → Preferences → Settings**

**2. Sök efter "Cline MCP"**
- Hitta **"Cline: MCP Servers"**-inställningen

**3. Klicka "Edit in settings.json"**

**4. Lägg till:**
```json
{
  "cline.mcpServers": {
    "skolverket": {
      "transportType": "http",
      "url": "https://skolverket-mcp.onrender.com/mcp"
    }
  }
}
```

**5. Reload VS Code**
- Cmd/Ctrl+Shift+P → "Developer: Reload Window"

#### Eller via config-fil

**`.vscode/cline_mcp_settings.json`:**
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

---

### Cursor

**Deeplink (automatisk installation):**

[cursor://anysphere.cursor-deeplink/mcp/install?name=skolverket&config=eyJ1cmwiOiJodHRwczovL3Nrb2x2ZXJrZXQtbWNwLm9ucmVuZGVyLmNvbS9tY3AifQ==](cursor://anysphere.cursor-deeplink/mcp/install?name=skolverket&config=eyJ1cmwiOiJodHRwczovL3Nrb2x2ZXJrZXQtbWNwLm9ucmVuZGVyLmNvbS9tY3AifQ==)

**Eller `.cursor/mcp.json`:**
```json
{
  "mcpServers": {
    "skolverket": {
      "type": "http",
      "url": "https://skolverket-mcp.onrender.com/mcp"
    }
  }
}
```

---

### VS Code Copilot

#### I VS Code (Rekommenderat)

**1. Öppna Settings**
- Cmd/Ctrl+, eller **File → Preferences → Settings**

**2. Sök efter "GitHub Copilot"**
- Hitta **"GitHub Copilot: Advanced"**

**3. Klicka "Edit in settings.json"**

**4. Lägg till under "github.copilot.advanced":**
```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "skolverket": {
        "type": "http",
        "url": "https://skolverket-mcp.onrender.com/mcp"
      }
    }
  }
}
```

**5. Reload VS Code**
- Cmd/Ctrl+Shift+P → "Developer: Reload Window"

#### Eller via CLI

```bash
code --add-mcp '{"name":"skolverket","type":"http","url":"https://skolverket-mcp.onrender.com/mcp"}'
```

---

### Gemini CLI

```bash
gemini mcp add --transport http skolverket https://skolverket-mcp.onrender.com/mcp
```

**Eller `~/.gemini/config.json`:**
```json
{
  "mcpServers": {
    "skolverket": {
      "httpUrl": "https://skolverket-mcp.onrender.com/mcp"
    }
  }
}
```

---

### OpenAI Codex

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

### För Lärare
- **Kursplanering:** "Jämför kunskapskraven E och A för Svenska 1 och ge förslag på bedömningsuppgifter"
- **Tematiskt arbete:** "Hitta alla kurser i gymnasiet som har hållbarhet i sitt centrala innehåll"
- **Bedömning:** "Visa alla kunskapskrav för betyg C i Biologi 1 och förklara skillnaderna mot B"

### För Elever & Föräldrar
- **Programval:** "Jämför Naturvetenskapsprogrammet och Teknikprogrammet - vilka kurser är obligatoriska?"
- **Kursval:** "Vilka matematikkurser finns på gymnasiet och vilka bygger på varandra?"
- **Betygskriterier:** "Vad krävs för att få A i Historia 1a1?"

### För Studie- och Yrkesvägledare
- **Vidareutbildning:** "Hitta alla yrkeshögskoleutbildningar inom IT som startar hösten 2025"
- **Programinfo:** "Vilka gymnasieprogram har programmering som obligatoriskt ämne?"
- **Utbildningsplatser:** "Lista SFI-utbildningar i Göteborg med distansalternativ"

### För Administratörer & Beslutsfattare
- **Läroplansförändringar:** "Visa alla versioner av Engelska 5 och vad som ändrats"
- **Skolregister:** "Hitta alla aktiva gymnasieskolor i Stockholms län"
- **Kursutbud:** "Vilka skolor erbjuder Ekonomiprogrammet i Malmö?"

### För Forskare & Utbildare
- **Läroplansanalys:** "Analysera hur begreppet 'programmering' har utvecklats i läroplaner 2011-2025"
- **Jämförande studier:** "Jämför kunskapskrav mellan GY11 och tidigare gymnasieläroplaner"

---

## 🆘 Support

**GitHub Issues:** https://github.com/KSAklfszf921/skolverket-mcp/issues
**Email:** isak.skogstad@me.com • **X:** [@isakskogstad](https://x.com/isakskogstad)

---

## 📝 Licens

MIT License – Data från Skolverkets öppna API:er. Inte officiellt associerad med Skolverket.

---

**📦 Version: 2.1.0 • 🔧 MCP Protocol: 2025-03-26**
