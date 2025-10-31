# 🔄 Auto-Deploy Konfiguration

Detta dokument beskriver hur automatisk deployment fungerar för Skolverket MCP.

## 📦 Deployment Pipeline

```
Git Tag (v2.1.x) → GitHub Action → npm → MCP Registry
                                          ↓
Git Push → Render Auto-Deploy
```

## 🚀 Plattformar

### 1. npm Registry

**Status:** ✅ Auto-deploy via GitHub Actions

**Trigger:** När du pushar en ny Git tag (format: `v*.*.*`)

**Workflow:** `.github/workflows/publish-npm.yml`

**Steg:**
1. Checkout kod
2. Installera dependencies (`npm ci`)
3. Bygga projektet (`npm run build`)
4. Publicera till npm (`npm publish`)

**Krav:**
- npm Access Token måste sättas som GitHub Secret: `NPM_TOKEN`

**Så här sätter du NPM_TOKEN:**
1. Gå till https://www.npmjs.com/settings/[ditt-användarnamn]/tokens
2. Klicka "Generate New Token" → "Classic Token"
3. Välj "Automation"
4. Kopiera token
5. Gå till GitHub Repo → Settings → Secrets and variables → Actions
6. Klicka "New repository secret"
7. Name: `NPM_TOKEN`
8. Value: [din token]

### 2. MCP Registry

**Status:** ✅ Auto-deploy via GitHub Actions

**Trigger:** Körs automatiskt efter framgångsrik npm-publicering

**Workflow:** `.github/workflows/publish-mcp-registry.yml`

**Steg:**
1. Väntar på att npm-workflow slutförs
2. Installerar `mcp-publisher` CLI
3. Loggar in med GitHub
4. Publicerar till MCP Registry

**Krav:**
- Använder `GITHUB_TOKEN` (automatiskt tillgänglig i Actions)

### 3. Render

**Status:** ✅ Auto-deploy från GitHub (om konfigurerat)

**Trigger:** När kod pushas till `master`-branchen

**Konfiguration:**
Verifiera att auto-deploy är aktiverat:
1. Gå till https://dashboard.render.com/
2. Välj din service: `skolverket-mcp`
3. Gå till **Settings** → **Build & Deploy**
4. Kontrollera att **Auto-Deploy** är **YES**

Om auto-deploy INTE är aktiverat:
1. Klicka på **Auto-Deploy**-inställningen
2. Välj **YES**
3. Spara

### 4. AlternativeTo

**Status:** ⚪ Manuell (community-driven plattform)

AlternativeTo kräver manuell uppdatering av mjukvaruinformation via deras webbgränssnitt.

## 📝 Användning

### Publicera en ny version

1. **Uppdatera version:**
   ```bash
   # Redigera package.json och server.json
   # Uppdatera CHANGELOG.md
   ```

2. **Committa ändringar:**
   ```bash
   git add package.json server.json CHANGELOG.md
   git commit -m "chore: Bump version to 2.1.3"
   git push origin master
   ```

3. **Skapa och pusha tag:**
   ```bash
   git tag v2.1.3
   git push origin v2.1.3
   ```

4. **GitHub Actions gör resten:**
   - Publicerar till npm automatiskt
   - Publicerar till MCP Registry automatiskt
   - Render deployas automatiskt (från `master` push)

### Manuell override

Om något går fel kan du alltid köra manuellt:

```bash
# npm
npm run build && npm publish

# MCP Registry
mcp-publisher login github
mcp-publisher publish

# Render
# Gå till dashboard och klicka "Manual Deploy"
```

## 🔍 Verifiera Deployment

### Kontrollera npm
```bash
npm info skolverket-mcp version
```

### Kontrollera MCP Registry
```bash
curl -I https://registry.modelcontextprotocol.io/servers/io.github.KSAklfszf921/skolverket-mcp
```

### Kontrollera Render
```bash
curl -s https://skolverket-mcp.onrender.com/health | jq .version
```

## ⚙️ GitHub Actions Status

Du kan följa deployment-status i GitHub:

**URL:** https://github.com/KSAklfszf921/Skolverket-MCP/actions

Varje push och tag-skapande triggar workflows som visas här.

## 🚨 Felsökning

### npm-publicering misslyckas
- Kontrollera att `NPM_TOKEN` är satt korrekt
- Verifiera att token har `Automation` permissions
- Kolla att `package.json` version är högre än nuvarande

### MCP Registry-publicering misslyckas
- Kontrollera att npm-steget slutfördes framgångsrikt först
- Verifiera att `server.json` finns och är korrekt formaterat
- Logga `GITHUB_TOKEN` har rätt permissions

### Render deployas inte
- Kontrollera att Auto-Deploy är aktiverat i Render dashboard
- Verifiera att GitHub-connection är aktiv
- Kolla Render logs för fel

## 📚 Mer Information

- [npm Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [MCP Registry Guide](https://github.com/modelcontextprotocol/registry)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Auto-Deploy](https://render.com/docs/deploys)
