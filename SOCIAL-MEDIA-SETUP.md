# 🎨 Social Media Preview Setup

## ✅ Vad som är klart:

1. **Metadata optimerad** ✨
   - HTTPS-länkar istället för HTTP
   - Open Graph metadata förbättrad (Facebook, LinkedIn, Discord)
   - Twitter/X Card metadata med separata bilder
   - LinkedIn-specifik metadata
   - Bild-dimensioner och alt-text tillagda
   - Canonical URL tillagd

2. **HTML-preview filer skapade** 🖼️
   - `og-image.html` (1200x630px) - För Facebook, LinkedIn, generell
   - `og-image-twitter.html` (1200x675px) - För Twitter/X
   - `og-image-square.html` (1200x1200px) - För Instagram

3. **Static file serving konfigurerat** 📁
   - Express.static middleware tillagt
   - `public/` katalog skapad
   - Servern servar nu statiska filer från `/public`

## 📋 Nästa steg - Ta screenshots:

### 1. Öppna HTML-preview filerna
Filerna är redan öppnade i din webbläsare. Om inte, kör:
```bash
cd /Users/isak/Desktop/skolverket-mcp
open og-image.html og-image-twitter.html og-image-square.html
```

### 2. Ta screenshots med exakta dimensioner

#### **Alternativ A: macOS Screenshot Tool (Rekommenderat)**
```bash
# Tryck Cmd+Shift+5
# Välj "Capture Selected Window"
# Klicka på webbläsarfönstret
```

#### **Alternativ B: Chrome DevTools (Mest exakt!)**
1. Öppna Chrome DevTools (F12)
2. Tryck `Cmd+Shift+P` (macOS) eller `Ctrl+Shift+P` (Windows)
3. Skriv "Capture screenshot"
4. Välg "Capture screenshot"

### 3. Spara bilderna med rätt namn i `public/` katalogen:

```
public/
├── og-image.png          (1200x630px)
├── og-image-twitter.png  (1200x675px)
└── og-image-square.png   (1200x1200px)
```

### 4. Optimera bildstorlek (valfritt men rekommenderat)

```bash
# Installera ImageMagick om du inte har det
brew install imagemagick

# Optimera bilderna
cd public
convert og-image.png -quality 85 -strip og-image.png
convert og-image-twitter.png -quality 85 -strip og-image-twitter.png
convert og-image-square.png -quality 85 -strip og-image-square.png
```

### 5. Committa och pusha ändringarna

```bash
git add .
git commit -m "feat: Add optimized social media preview images and metadata

- Add HTTPS for all OG and Twitter Card metadata
- Add platform-specific images (Twitter, Facebook, LinkedIn)
- Add image dimensions and alt text
- Configure express.static for serving images from /public
- Create preview HTML files for generating social media images"

git push origin main
```

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

## 🎯 Förväntade resultat:

När du delar länken på sociala medier kommer användare se:

- 🎨 Snygg lila gradient-bild med MCP-logotyp
- 📚 Tydlig titel och beskrivning
- 🏷️ Tre API-kategorier synliga (Läroplan, Skolenhetsregistret, Vuxenutbildning)
- 🔢 Version och antal verktyg (29 verktyg • v2.1.0)

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
- Använd Chrome DevTools för exakta screenshots
- Verifiera med `file public/og-image.png` att dimensionerna stämmer
