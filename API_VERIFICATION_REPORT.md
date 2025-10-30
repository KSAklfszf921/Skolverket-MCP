# API-terminologiverifiering - Skolverket MCP
## Rapport från 2025-01-30

Denna rapport jämför Skolverket MCP-serverns implementation mot Skolverkets officiella OpenAPI-specifikationer.

---

## 🔴 KRITISKA PROBLEM

### 1. Läroplan API - Felaktiga timespan-värden

**Problem:** MCP-servern använder timespan-värden som inte existerar i det officiella API:et.

**Officiell API (ALLA Läroplan API endpoints):**

Bekräftat i:
- `subject_v1_swagger.yaml` (Subjects API)
- `course_v1_swagger.yaml` (Courses API)
- `curriculum_v1_swagger.yaml` (Curriculum API)

```yaml
enum:
  - LATEST
  - FUTURE
  - EXPIRED
  - MODIFIED
```

Beskrivning från officiell spec:
> "Tidsspann som som skickats i request. Exempel på urval är LATEST, FUTURE, EXPIRED, MODIFIED."

**MCP Server Implementation:**
```typescript
// src/types/syllabus.ts, rad 16
export type Timespan = 'LATEST' | 'HISTORIC' | 'ALL';
```

**Konsekvens:**
- Användare som anger `timespan: 'HISTORIC'` kommer få felaktiga resultat
- Användare som anger `timespan: 'ALL'` kommer få felaktiga resultat
- Giltiga värden `'FUTURE'`, `'EXPIRED'`, `'MODIFIED'` är inte tillgängliga

**Rekommenderad fix:**
```typescript
export type Timespan = 'LATEST' | 'FUTURE' | 'EXPIRED' | 'MODIFIED';
```

---

### 2. Skolenhetsregistret API - Fel API-version och endpoint

**Problem:** MCP-servern använder v3-endpoint för ett API som officiellt är v2.

**Officiell API:**
```yaml
title: 'Skolenhetsregistret öppna API v2 - Skolverket'
servers:
  - url: https://api.skolverket.se/skolenhetsregistret
paths:
  /v2/school-units:
    # Officiell endpoint
```

**MCP Server Implementation:**
```typescript
// src/api/school-units-client.ts, rad 32
async getAllSchoolUnits(): Promise<any> {
  return this.get<any>('/v3/compact-school-units', { size: 100 });
}
```

**Konsekvens:**
- MCP använder `/v3/compact-school-units` när officiell API använder `/v2/school-units`
- Om v3 inte längre stöds eller skiljer sig kan requests misslyckas
- Parametrar och struktur kan skilja sig mellan v2 och v3

**Rekommenderad fix:**
```typescript
async getAllSchoolUnits(): Promise<any> {
  return this.get<any>('/v2/school-units', { /* korrekta v2 params */ });
}
```

---

### 3. Skolenhetsregistret API - Felaktig Accept-header

**Problem:** MCP använder Planned Educations API:ets accept-header för Skolenhetsregistret.

**MCP Server Implementation:**
```typescript
// src/api/school-units-client.ts, rad 24
customAcceptHeader: 'application/vnd.skolverket.plannededucations.api.v3.hal+json'
```

**Korrekt header enligt v2 API:**
- Standard `application/json` eller ingen specialiserad header krävs
- Denna header är specifik för Planned Educations API, INTE Skolenhetsregistret

**Konsekvens:**
- Servern kan returnera fel format eller avvisa requests
- API kan inte returnera rätt data

**Rekommenderad fix:**
```typescript
// Ta bort customAcceptHeader eller använd korrekt header för v2
// Troligen behövs ingen specialiserad header för v2
```

---

## ✅ KORREKTA IMPLEMENTATIONER

### Planned Educations API

**Parametrar verifierade:**
- ✅ `typeOfSchool` - Korrekt (yh, sfi, vuxgy, vuxgr, etc.)
- ✅ `paceOfStudy` - Korrekt (25, 50, 100, range-format)
- ✅ `distance` - Korrekt (true/false/empty)
- ✅ Endpoint `/v3/adult-education-events` - Korrekt enligt WebFetch-resultat
- ✅ Accept header `application/vnd.skolverket.plannededucations.api.v3.hal+json` - Korrekt

### Skolenhetsregistret v2 API - Parametrar

**Parametrar som SKULLE vara korrekta om rätt endpoint används:**
- ✅ `status` enum: AKTIV, VILANDE, UPPHORT, PLANERAD (enligt v2 spec)
- ✅ `school_type` parametrar (GR, GY, VUX, etc.)
- ✅ `municipality_code` format

---

## 📋 SAMMANFATTNING AV ÄNDRINGAR

### Högprioriterade fixar (kan orsaka fel):

#### 1. Type Definition - src/types/syllabus.ts rad 16
```typescript
// Ändra från:
export type Timespan = 'LATEST' | 'HISTORIC' | 'ALL';
// Till:
export type Timespan = 'LATEST' | 'FUTURE' | 'EXPIRED' | 'MODIFIED';
```

#### 2. Zod Validation Schemas - Uppdatera i ALLA dessa filer:

**src/tools/syllabus/subjects.ts rad 11:**
```typescript
// Ändra från:
timespan: z.enum(['LATEST', 'HISTORIC', 'ALL']).default('LATEST')
// Till:
timespan: z.enum(['LATEST', 'FUTURE', 'EXPIRED', 'MODIFIED']).default('LATEST')
```

**src/tools/syllabus/courses.ts:**
```typescript
// Samma ändring som ovan
```

**src/tools/syllabus/programs.ts:**
```typescript
// Samma ändring som ovan
```

**src/tools/syllabus/curriculums.ts:**
```typescript
// Samma ändring som ovan
```

**src/tools/syllabus/valuestore.ts:**
```typescript
// Om timespan används här, uppdatera
```

#### 3. Function Signatures - Uppdatera i samma filer:

**src/tools/syllabus/subjects.ts rad 27:**
```typescript
// Ändra från:
timespan?: 'LATEST' | 'HISTORIC' | 'ALL';
// Till:
timespan?: 'LATEST' | 'FUTURE' | 'EXPIRED' | 'MODIFIED';
```

**Upprepa för:**
- src/tools/syllabus/courses.ts
- src/tools/syllabus/programs.ts
- src/tools/syllabus/curriculums.ts

#### 4. Skolenhetsregistret API - src/api/school-units-client.ts

**Rad 24:**
```typescript
// Ändra från:
customAcceptHeader: 'application/vnd.skolverket.plannededucations.api.v3.hal+json'
// Till:
// Ta bort denna rad helt (använd standard application/json)
```

**Rad 32:**
```typescript
// Ändra från:
return this.get<any>('/v3/compact-school-units', { size: 100 });
// Till:
return this.get<any>('/v2/school-units', { /* lägg till korrekta v2 params */ });
```

#### 5. Dokumentation

Uppdatera följande filer för att reflektera korrekta parametervärden:
- docs/API.md
- docs/EXAMPLES.md
- README.md (om timespan nämns där)

---

## 🧪 TESTPLAN

Efter fixar, verifiera att:

1. ✅ Läroplan API-anrop med `timespan: 'FUTURE'` fungerar
2. ✅ Läroplan API-anrop med `timespan: 'EXPIRED'` fungerar
3. ✅ Läroplan API-anrop med `timespan: 'MODIFIED'` fungerar
4. ✅ Skolenhetsregistret v2 endpoint returnerar korrekt data
5. ✅ Alla MCP-klienter (Claude Code, ChatGPT, etc.) kan använda korrigerade parametrar

---

## 📚 KÄLLREFERENSER

- **Läroplan API Swagger:** `/Users/isak/Downloads/subject_v1_swagger (3).yaml`
- **Skolenhetsregistret v2 OpenAPI:** `/Users/isak/Downloads/skolenhetsregistret_v2_openapi (1).yaml`
- **Planned Educations API:** Verifierad via WebFetch

---

**Rapport skapad:** 2025-01-30
**MCP Server Version:** 2.1.0
**Analyserat av:** Claude Code
