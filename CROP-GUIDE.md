# 📐 Beskärningsguide för Social Media Bilder

Använd originalbilden (1280x640px eller 1150x575px) och beskär för olika plattformar.

## 🎯 Källbilder

**Image #1** (1280x640px) - Rekommenderad
- Innehåll: MCP-logo, "Skolverket MCP", undertitel, API-taggar
- Layout: Horisontal, välbalanserad

**Image #2** (1150x575px) - Alternativ
- Liknande layout, mindre storlek

---

## ✂️ Beskärningsinstruktioner

### 1. Facebook / LinkedIn / Discord (1200x630px)
**Ratio:** 1.91:1 (bred)
**Storlek:** 1200 x 630 px

#### Från Image #1 (1280x640):
```
Ursprunglig storlek: 1280 x 640
Målstorlek: 1200 x 630

Beskärning:
- Beskär 40px från vänster (eller 20px från varje sida)
- Beskär 10px från toppen eller botten (centrera vertikalt)
- Detta behåller nästan allt innehåll

Alternativ: Skala ner till 1200px bredd först, sedan beskär höjden till 630px
```

**Beskärning i Figma/Photoshop:**
- X: 40, Y: 5, Width: 1200, Height: 630
- ELLER centrera och beskär till 1200x630

**Viktigt:**
- ✅ Behåll MCP-logotyp uppe till vänster
- ✅ Behåll hela "Skolverket MCP" titeln
- ✅ Behåll undertexten
- ✅ Behåll alla tre API-taggarna

---

### 2. Twitter/X Large Card (1200x675px)
**Ratio:** 16:9 (video ratio)
**Storlek:** 1200 x 675 px

#### Från Image #1 (1280x640):
```
Ursprunglig storlek: 1280 x 640
Målstorlek: 1200 x 675

Problem: Källbilden är 640px hög, vi behöver 675px
Lösning: Lägg till 35px extra utrymme (17-18px top/bottom)
```

**Beskärning i Figma/Photoshop:**
1. **Alternativ A (Rekommenderat):** Lägg till canvas
   - Expandera canvas till 1200x675
   - Centrera originalbilden
   - Fyll bakgrund med gradient-färg (#8B1F62 eller #6B1850)

2. **Alternativ B:** Skala
   - Skala upp bilden med 5.5% (640 → 675)
   - Beskär till 1200x675
   - OBS: Kan ge lätt förstoring av text

**Viktigt:**
- ✅ Behåll all viktig information
- ✅ Se till att texten inte skärs av
- ⚠️ Extra utrymme top/bottom OK (fylls med gradient)

---

### 3. Square / Instagram (1200x1200px)
**Ratio:** 1:1 (kvadrat)
**Storlek:** 1200 x 1200 px

#### Från Image #1 (1280x640):
```
Ursprunglig storlek: 1280 x 640
Målstorlek: 1200 x 1200

Problem: Källbilden är bred (1280x640), vi behöver kvadrat
Lösning: Lägg till utrymme top/bottom
```

**Beskärning i Figma/Photoshop:**
1. **Skapa 1200x1200 canvas**
2. **Centrera originalbilden vertikalt**
   - Beskär/skala originalbilden till 1200px bred
   - Placera i mitten vertikalt (280px utrymme top, 280px bottom)
3. **Fyll bakgrund**
   - Top-sektion: Gradient (#8B1F62 → #6B1850)
   - Bottom-sektion: Gradient (#6B1850 → #4A1038)

**Layout för kvadrat:**
```
┌─────────────────┐
│   [Top padding] │ ← 280px gradient
├─────────────────┤
│  MCP Logo       │
│  Skolverket MCP │ ← Original content (640px)
│  Undertitel     │
│  API-taggar     │
├─────────────────┤
│ [Bottom padding]│ ← 280px gradient
└─────────────────┘
```

**Viktigt:**
- ✅ Hela originalbilden ska synas i mitten
- ✅ Gradient ska matcha original-bakgrunden
- ✅ Inget innehåll får skäras bort

---

## 🛠️ Verktyg & Metod

### Rekommenderat arbetsflöde:

1. **Öppna originalbilden i:**
   - Figma (bäst för exakt beskärning)
   - Photoshop
   - Preview (macOS) med beskärningsverktyg
   - GIMP (gratis alternativ)

2. **För Facebook/LinkedIn (1200x630):**
   ```bash
   # ImageMagick (om installerat)
   convert image1.png -gravity center -crop 1200x630+0+0 og-image.png
   ```

3. **För Twitter (1200x675):**
   ```bash
   # Lägg till canvas och centrera
   convert image1.png -gravity center -background "#6B1850" -extent 1200x675 og-image-twitter.png
   ```

4. **För Square (1200x1200):**
   ```bash
   # Lägg till canvas vertikalt
   convert image1.png -resize 1200x -gravity center -background "#6B1850" -extent 1200x1200 og-image-square.png
   ```

---

## ✅ Checklista efter beskärning:

- [ ] **Filstorlek** under 1MB (helst under 500KB)
- [ ] **Dimensioner** exakt rätt (1200x630, 1200x675, 1200x1200)
- [ ] **All text** är läsbar och inte beskuren
- [ ] **Logotyper** är kompletta
- [ ] **API-taggar** syns alla tre
- [ ] **Gradient** ser mjuk ut (ingen pixelering)
- [ ] **Filformat** PNG för bästa kvalitet

---

## 📁 Slutliga filnamn:

Spara i `/public`:
```
public/
├── og-image.png          (1200x630)
├── og-image-twitter.png  (1200x675)
└── og-image-square.png   (1200x1200)
```

---

## 🎨 Färgkoder för bakgrund (om du behöver fylla):

```css
Gradient stops:
- #8B1F62 (Start - mörkare magenta)
- #6B1850 (Mitt - medium magenta)
- #4A1038 (Slut - mörkaste)

Gradient direction: 135deg (diagonal top-left to bottom-right)
```

---

## 💡 Tips:

1. **Använd Image #1** (1280x640) - den är större och ger bättre kvalitet
2. **Centrera innehållet** vid beskärning
3. **Testa alla tre storlekarna** med validators innan upload
4. **Optimera filstorlek** med ImageMagick eller TinyPNG efter beskärning
