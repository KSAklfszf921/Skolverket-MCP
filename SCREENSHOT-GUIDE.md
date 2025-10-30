# 📸 Screenshot Guide för Social Media Bilder

## Hur du tar screenshots av HTML-filerna:

### På macOS:
1. Tryck `Cmd + Shift + 5` för att öppna screenshot-verktyget
2. Välj "Capture Selected Window"
3. Klicka på webbläsarfönstret med preview-bilden
4. Spara med följande namn:

## Filnamn och storlekar:

### 1. og-image.png (1200x630px)
- **Fil**: `og-image.html`
- **Storlek**: 1200 x 630 px (1.91:1)
- **För**: Facebook, LinkedIn, Discord, generell Open Graph
- **Spara som**: `public/og-image.png`

### 2. og-image-twitter.png (1200x675px)
- **Fil**: `og-image-twitter.html`
- **Storlek**: 1200 x 675 px (16:9)
- **För**: Twitter/X Large Card
- **Spara som**: `public/og-image-twitter.png`

### 3. og-image-square.png (1200x1200px)
- **Fil**: `og-image-square.html`
- **Storlek**: 1200 x 1200 px (1:1)
- **För**: Instagram, vissa LinkedIn-poster
- **Spara som**: `public/og-image-square.png`

## Optimera filstorlek:

Efter att du tagit screenshots, optimera bilderna:

```bash
# Installera ImageMagick (om du inte har det)
brew install imagemagick

# Optimera bilderna (behåll kvalitet, reducera filstorlek)
cd public
convert og-image.png -quality 85 -strip og-image.png
convert og-image-twitter.png -quality 85 -strip og-image-twitter.png
convert og-image-square.png -quality 85 -strip og-image-square.png
```

## Alternativ: Använd webbläsarens screenshot-verktyg

### Chrome/Edge:
1. Öppna Developer Tools (F12)
2. Tryck `Cmd + Shift + P` (macOS) eller `Ctrl + Shift + P` (Windows)
3. Skriv "Capture screenshot"
4. Välj "Capture screenshot" (tar bild av exakt viewport)

### Firefox:
1. Högerklicka på sidan
2. Välj "Take Screenshot"
3. Välj hela sidan eller område

## Verifiera bilder:

Efter att bilderna är sparade, kontrollera:
- ✅ Filstorlek under 1MB (helst under 500KB)
- ✅ Korrekt pixel-dimensioner
- ✅ Bildkvalitet ser bra ut
- ✅ All text är läsbar

## Testa social media preview:

1. **Facebook**: https://developers.facebook.com/tools/debug/
2. **Twitter/X**: https://cards-dev.twitter.com/validator
3. **LinkedIn**: Dela länken direkt och se preview
4. **Universal**: https://www.opengraph.xyz/
