#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════"
echo "🔍 FULLSTÄNDIG DEPLOYMENT VERIFIERING"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. GitHub Workflows
echo "1️⃣  GITHUB WORKFLOWS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if gh api repos/KSAklfszf921/Skolverket-MCP/contents/.github/workflows/publish-npm.yml &>/dev/null; then
  echo -e "${GREEN}✅ publish-npm.yml finns på GitHub${NC}"
else
  echo -e "${RED}❌ publish-npm.yml saknas på GitHub${NC}"
fi

if gh api repos/KSAklfszf921/Skolverket-MCP/contents/.github/workflows/publish-mcp-registry.yml &>/dev/null; then
  echo -e "${GREEN}✅ publish-mcp-registry.yml finns på GitHub${NC}"
else
  echo -e "${RED}❌ publish-mcp-registry.yml saknas på GitHub${NC}"
fi

# 2. GitHub Actions Status
echo ""
echo "2️⃣  GITHUB ACTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 https://github.com/KSAklfszf921/Skolverket-MCP/actions"
gh run list --limit 3 2>/dev/null || echo "Inga workflows körda än"

# 3. npm Package
echo ""
echo "3️⃣  NPM PACKAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NPM_VERSION=$(npm info skolverket-mcp version 2>/dev/null)
echo "📦 Version: $NPM_VERSION"

# Check if server.json is in package
cd /tmp && rm -rf verify-npm && mkdir verify-npm && cd verify-npm
npm pack skolverket-mcp@latest --silent 2>&1 > /dev/null
if tar -tzf skolverket-mcp-*.tgz | grep -q "package/server.json"; then
  echo -e "${GREEN}✅ server.json finns i npm-paketet${NC}"
else
  echo -e "${RED}❌ server.json saknas i npm-paketet${NC}"
fi

# 4. MCP Registry
echo ""
echo "4️⃣  MCP REGISTRY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
MCP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://registry.modelcontextprotocol.io/servers/io.github.KSAklfszf921/skolverket-mcp")
if [ "$MCP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Registrerad och synlig (HTTP 200)${NC}"
  MCP_VERSION=$(curl -s "https://registry.modelcontextprotocol.io/servers/io.github.KSAklfszf921/skolverket-mcp" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).version); } catch(e) { console.log('N/A'); }")
  echo "🏷️  Version: $MCP_VERSION"
else
  echo -e "${YELLOW}⏳ Status: HTTP $MCP_STATUS (väntar på indexering)${NC}"
fi

# 5. Render Server
echo ""
echo "5️⃣  RENDER SERVER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RENDER_DATA=$(curl -s "https://skolverket-mcp.onrender.com/health")
RENDER_VERSION=$(echo "$RENDER_DATA" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).version); } catch(e) { console.log('N/A'); }")
RENDER_STATUS=$(echo "$RENDER_DATA" | node -e "try { console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')).status); } catch(e) { console.log('N/A'); }")

echo "🏷️  Version: $RENDER_VERSION"
echo "💚 Status: $RENDER_STATUS"

if [ "$RENDER_VERSION" = "2.1.3" ]; then
  echo -e "${GREEN}✅ KORREKT VERSION DEPLOYAD${NC}"
else
  echo -e "${YELLOW}⚠️  Gammal version - Trigger redeploy i Render Dashboard${NC}"
  echo "🔗 https://dashboard.render.com/"
fi

# 6. Version Consistency
echo ""
echo "6️⃣  VERSIONSKONSISTENS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PKG_VER=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
echo "• package.json:  $PKG_VER"
echo "• npm Registry:  $NPM_VERSION"
echo "• Render Server: $RENDER_VERSION"

if [ "$PKG_VER" = "$NPM_VERSION" ] && [ "$PKG_VER" = "$RENDER_VERSION" ]; then
  echo -e "${GREEN}✅ ALLA VERSIONER KONSEKVENTA${NC}"
else
  echo -e "${YELLOW}⚠️  Versionsskillnader upptäckta${NC}"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "📊 SAMMANFATTNING"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "🔗 Viktiga länkar:"
echo "  • GitHub:        https://github.com/KSAklfszf921/Skolverket-MCP"
echo "  • npm:           https://www.npmjs.com/package/skolverket-mcp"
echo "  • MCP Registry:  https://registry.modelcontextprotocol.io/servers/io.github.KSAklfszf921/skolverket-mcp"
echo "  • Render:        https://skolverket-mcp.onrender.com/mcp"
echo "  • GitHub Actions: https://github.com/KSAklfszf921/Skolverket-MCP/actions"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
