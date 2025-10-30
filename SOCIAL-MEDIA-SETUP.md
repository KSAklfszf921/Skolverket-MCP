# 🎨 Social Media Preview Setup

## ✅ Vad som är klart:

1. **Metadata optimerad** ✨
   - HTTPS-länkar istället för HTTP
   - Open Graph metadata förbättrad (Facebook, LinkedIn, Discord)
   - Twitter/X Card metadata med separata bilder
   - LinkedIn-specifik metadata
   - Bild-dimensioner och alt-text tillagda
   - Canonical URL tillagd

2. **Static file serving konfigurerat** 📁
   - Express.static middleware tillagt
   - `public/` katalog skapad
   - Servern servar nu statiska filer från `/public`

3. **Beskärningsguide skapad** 📐
   - Detaljerade instruktioner i `CROP-GUIDE.md`
   - Instruktioner för alla tre storlekar
   - ImageMagick-kommandon inklusive

---

## 📋 Nästa steg - Beskär och ladda upp bilder:

### 1. Använd originalbilden

Använd den bifogade bilden (1280x640px) som källa.

### 2. Beskär för varje plattform

Se detaljerade instruktioner i **CROP-GUIDE.md**:

#### **Facebook / LinkedIn / Discord** (1200x630px)
```bash
# Med ImageMagick
convert original-image.png -gravity center -crop 1200x630+0+0 public/og-image.png
```

#### **Twitter/X** (1200x675px)
```bash
# Lägg till canvas och centrera
convert original-image.png -gravity center -background "#6B1850" -extent 1200x675 public/og-image-twitter.png
```

#### **Square / Instagram** (1200x1200px)
```bash
# Lägg till canvas vertikalt
convert original-image.png -resize 1200x -gravity center -background "#6B1850" -extent 1200x1200 public/og-image-square.png
```

### 3. Optimera filstorlek

```bash
cd public
# Optimera bilderna (behåll kvalitet, reducera filstorlek)
convert og-image.png -quality 85 -strip og-image.png
convert og-image-twitter.png -quality 85 -strip og-image-twitter.png
convert og-image-square.png -quality 85 -strip og-image-square.png
```

### 4. Verifiera bilderna

```bash
# Kontrollera dimensioner
file public/og-image.png
file public/og-image-twitter.png
file public/og-image-square.png

# Kontrollera filstorlek
ls -lh public/*.png
```

### 5. Committa och pusha

```bash
git add public/*.png
git commit -m "Add social media preview images (1200x630, 1200x675, 1200x1200)"
git push origin main
```

---

## 🧪 Testa social media preview:

Efter deploy kan du testa med dessa verktyg:

1. **Facebook**: https://developers.facebook.com/tools/debug/
2. **Twitter/X**: https://cards-dev.twitter.com/validator
3. **LinkedIn**: Dela länken direkt och se preview
4. **Universal Validator**: https://www.opengraph.xyz/

### Test-URL:
```
https://skolverket-mcp.onrender.com/
```

---

## 📊 Metadata Summary:

### Facebook / LinkedIn / Discord
- **Bild**: `/og-image.png` (1200x630px)
- **Titel**: "Skolverket MCP Server - AI-tillgång till svenska läroplaner"
- **Beskrivning**: "Anslut ChatGPT, Claude och andra AI-assistenter till Skolverkets officiella API:er. 29 verktyg för läroplaner, skolenheter och vuxenutbildning."

### Twitter/X
- **Card**: `summary_large_image`
- **Bild**: `/og-image-twitter.png` (1200x675px)
- **Titel**: "Skolverket MCP Server - AI-tillgång till svenska läroplaner"
- **Beskrivning**: "Anslut ChatGPT, Claude och andra AI-assistenter till Skolverkets officiella API:er. 29 verktyg för läroplaner, skolenheter och vuxenutbildning."

### Bildkrav uppfyllda:
- ✅ 1200x630px för Facebook/LinkedIn/generell (1.91:1)
- ✅ 1200x675px för Twitter (16:9)
- ✅ 1200x1200px för square/Instagram (1:1)
- ✅ Under 1MB filstorlek (efter optimering)
- ✅ HTTPS länkar
- ✅ Alt text och dimensioner

---

## 🎯 Förväntade resultat:

När du delar länken på sociala medier kommer användare se:

- 🎨 Snygg lila gradient-bild med MCP-logotyp
- 📚 Tydlig "Skolverket MCP" titel
- 🏷️ Tre API-kategorier synliga (Läroplan, Skolenhetsregistret, Vuxenutbildning)
- 📝 Informativ undertitel

---

## 🐛 Felsökning:

### Bilden visas inte?
- Kontrollera att filen finns i `public/` katalogen
- Verifiera att filnamnet stämmer exakt
- Testa URL:en direkt: `https://skolverket-mcp.onrender.com/og-image.png`

### Gammal cache på sociala medier?
- Facebook: Använd debug tool för att scrape om
- Twitter: Cache cleara vanligen inom några minuter
- LinkedIn: Kan ta upp till 7 dagar, använd "Post Inspector"

### Fel dimensioner?
- Använd `file` kommandot för att verifiera dimensioner
- Kontrollera med validators att bilderna visas korrekt

---

## 📁 Filstruktur:

```
skolverket-mcp/
├── public/
│   ├── og-image.png          (1200x630)
│   ├── og-image-twitter.png  (1200x675)
│   └── og-image-square.png   (1200x1200)
├── CROP-GUIDE.md            (Beskärningsinstruktioner)
└── SOCIAL-MEDIA-SETUP.md    (Denna fil)
```

---

## 🎨 Bildinnehåll:

Alla bilder innehåller:
- MCP-logotyp (vit) + "Model Context Protocol" text
- "Skolverket MCP" som huvudtitel (serif italic + sans-serif)
- Undertitel: "AI-tillgång till svenska läroplaner, kurser, ämnen och skolenheter via MCP"
- Tre API-taggar: "Läroplan API", "Skolenhetsregistret", "Vuxenutbildning"
- Version: "29 verktyg • v2.1.0"
- Lila gradient-bakgrund (#8B1F62 → #6B1850 → #4A1038)
- Subtil geometrisk pattern
