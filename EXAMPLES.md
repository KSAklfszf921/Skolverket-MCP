# Användningsexempel för Skolverket Syllabus MCP

Detta dokument innehåller praktiska exempel på hur du kan använda Skolverket Syllabus MCP servern med Claude.

## Grundläggande Exempel

### Söka efter ämnen

**Fråga till Claude:**
"Visa alla ämnen för grundskolan"

**Vad som händer:**
Claude använder `search_subjects` verktyget med parametern `schooltype: "GR"`.

---

**Fråga till Claude:**
"Vilka ämnen finns på gymnasiet?"

**Vad som händer:**
Claude använder `search_subjects` med `schooltype: "GY"`.

---

### Hämta ämnesdetaljer

**Fråga till Claude:**
"Ge mig detaljerad information om matematik i grundskolan"

**Vad som händer:**
1. Claude söker först efter matematik i grundskolan med `search_subjects`
2. Hittar ämneskoden (t.ex. `GRGRMAT01`)
3. Använder `get_subject_details` för att hämta fullständig information

---

## Kurser

### Söka kurser

**Fråga till Claude:**
"Lista alla matematikkurser på gymnasiet"

**Vad som händer:**
Claude använder `search_courses` med parametrar:
- `schooltype: "GY"`
- Filtrerar sedan resultatet på kurser som innehåller "matematik"

---

### Jämföra kurser

**Fråga till Claude:**
"Vad är skillnaden mellan Matematik 1a, 1b och 1c?"

**Vad som händer:**
1. Claude använder `get_course_details` tre gånger med koderna:
   - `MATMAT01a`
   - `MATMAT01b`
   - `MATMAT01c`
2. Analyserar och jämför innehåll, poäng och kunskapskrav

---

### Hitta kunskapskrav

**Fråga till Claude:**
"Vilka kunskapskrav finns för betyget E i Svenska 1?"

**Vad som händer:**
1. Claude använder `get_course_details` med kod `SVESVE01`
2. Extraherar och presenterar kunskapskraven för betyg E

---

## Program

### Lista program

**Fråga till Claude:**
"Vilka gymnasieprogram finns inom naturvetenskap och teknik?"

**Vad som händer:**
Claude använder `search_programs` med `schooltype: "GY"` och filtrerar sedan manuellt.

---

### Programdetaljer

**Fråga till Claude:**
"Berätta om Naturvetenskapsprogrammet - vilka inriktningar och yrkesutfall finns?"

**Vad som händer:**
1. Claude söker efter programmet med `search_programs`
2. Hittar koden `NA`
3. Använder `get_program_details` för fullständig information
4. Presenterar inriktningar, profiler och yrkesutfall

---

## Läroplaner

### Hämta läroplan

**Fråga till Claude:**
"Visa mig innehållet i Läroplan för grundskolan 2011 (LGR11)"

**Vad som händer:**
Claude använder `get_curriculum_details` med kod `LGR11`.

---

### Jämföra versioner

**Fråga till Claude:**
"Hur har läroplanen för gymnasiet ändrats över tid?"

**Vad som händer:**
1. Claude söker efter gymnasieläroplanen med `search_curriculums`
2. Använder `get_curriculum_versions` för att lista alla versioner
3. Hämtar olika versioner med `get_curriculum_details`
4. Analyserar och presenterar ändringar

---

## Hjälpverktyg

### Skoltyper

**Fråga till Claude:**
"Vilka skoltyper finns i Sverige?"

**Vad som händer:**
Claude använder `get_school_types` för att lista alla tillgängliga skoltyper.

---

### Ämnes- och kurskoder

**Fråga till Claude:**
"Hur hittar jag rätt kurskod för en kurs i engelska?"

**Vad som händer:**
Claude använder `get_subject_and_course_codes` och filtrerar på engelska-relaterade koder.

---

## Avancerade Exempel

### Kursplanering för lärare

**Fråga till Claude:**
"Jag ska undervisa Svenska 2 på gymnasiet. Ge mig en översikt över centralt innehåll och kunskapskrav."

**Vad som händer:**
1. Claude använder `get_course_details` med kod `SVESVE02`
2. Extraherar centralt innehåll
3. Extraherar kunskapskrav för alla betyg (E, C, A)
4. Presenterar strukturerat för lärarens planering

---

### Programval för elever

**Fråga till Claude:**
"Jag är intresserad av teknik och design. Vilka gymnasieprogram skulle passa mig och vad leder de till för yrken?"

**Vad som händer:**
1. Claude använder `search_programs` för att hitta relevanta program
2. Använder `get_program_details` för varje program
3. Extraherar yrkesutfall och inriktningar
4. Ger rekommendationer baserat på intresse

---

### Forskning och analys

**Fråga till Claude:**
"Hur har matematikundervisningen i grundskolan förändrats mellan olika läroplansgenerationer?"

**Vad som händer:**
1. Claude använder `search_subjects` för att hitta matematik i grundskolan
2. Använder `get_subject_versions` för att lista alla versioner
3. Hämtar detaljerad information för olika versioner
4. Analyserar förändringar i centralt innehåll och kunskapskrav
5. Presenterar trender och utveckling

---

### Kursutvärdering

**Fråga till Claude:**
"Jämför innehållet i Matematik 1a och Matematik 1b - vilken kurs är mest lämplig för ett yrkesprogram?"

**Vad som händer:**
1. Claude hämtar båda kurserna med `get_course_details`
2. Jämför centralt innehåll
3. Analyserar matematisk djup och praktisk tillämpning
4. Ger rekommendation baserat på yrkesprogrammets behov

---

### Ämnesintegration

**Fråga till Claude:**
"Vilka överlappningar finns mellan Svenska och Historia på gymnasiet som kan användas för tematiskt arbete?"

**Vad som händer:**
1. Claude hämtar ämnesinformation för både Svenska och Historia
2. Analyserar centralt innehåll i båda ämnena
3. Identifierar gemensamma teman och kopplingar
4. Föreslår integrationsmöjligheter

---

## Tips för Effektiv Användning

### Var specifik med skoltyp
Specificera alltid om du menar grundskola (GR) eller gymnasium (GY) för tydligare resultat.

**Bra:** "Visa matematikkurser för gymnasiet"
**Mindre bra:** "Visa matematikkurser"

### Använd rätt terminologi
Använd officiella termer som "kunskapskrav", "centralt innehåll", "läroplan" etc.

### Be om jämförelser
Claude kan jämföra olika versioner, kurser och ämnen effektivt.

**Exempel:** "Jämför Svenska 1, 2 och 3 - hur progressar innehållet?"

### Ställ följdfrågor
Om du får en kurskod eller ämneskod i ett svar, fråga direkt efter detaljer.

**Exempel:**
1. "Vilka kurser finns i svenska?"
2. "Berätta mer om kursen med kod SVESVE01"

### Be om strukturerad information
Du kan be Claude att organisera informationen på specifika sätt.

**Exempel:**
- "Skapa en tabell över alla gymnasieprogram med deras inriktningar"
- "Ge mig en bullet-list över kunskapskraven för Svenska 1"
- "Jämför i en tabell: Matematik 1a vs 1b vs 1c"

---

## Felsökning

### Om du får fel kurskod
Använd `get_subject_and_course_codes` för att se alla tillgängliga koder.

### Om sökningen returnerar för många resultat
Lägg till fler filter som skoltyp, tidsperiod eller läroplanstyp.

### Om du vill se historisk data
Använd `timespan: "ALL"` eller `"HISTORIC"` i sökningar.

---

## Vanliga Use Cases

1. **Lärare** - Kursplanering, bedömning, tematiskt arbete
2. **Elever** - Kursval, programval, förståelse för kunskapskrav
3. **Studie- och yrkesvägledare** - Programinformation, yrkesutfall
4. **Utbildningsadministratörer** - Läroplansförändringar, kursutbud
5. **Forskare** - Analys av läroplaner, historisk utveckling
6. **Föräldrar** - Förstå barnets skolgång, kurser och bedömning

---

## Ytterligare Resurser

- [Skolverkets officiella webbplats](https://www.skolverket.se/)
- [API-dokumentation](https://api.skolverket.se/syllabus/swagger-ui/index.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)
