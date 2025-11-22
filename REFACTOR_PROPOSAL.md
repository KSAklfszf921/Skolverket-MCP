# MCP Server Refactoring Proposal v3.0.0

## Executive Summary
Reducera antal verktyg från 64 till ~30 genom konsolidering med parametrar.
**Breaking change** - ny major version krävs.

## Problem Statement
- **12 verktyg** gör samma sak för olika skoltyper
- **4 verktyg** är format-varianter av samma funktion
- **8 verktyg** är v3-duplikat av v4-funktionalitet
- **Token overhead**: 64 schemas = ~50KB per ListTools request
- **Underhåll**: Ändringar måste göras på 12 ställen för statistik

## Solution: Parameterbaserad konsolidering

### 1. Statistikverktyg (12 → 3)

#### Före (12 verktyg):
```typescript
get_school_unit_statistics_fsk(code)
get_school_unit_statistics_gr(code)
get_school_unit_statistics_gran(code)
get_school_unit_statistics_gy(code)
get_school_unit_statistics_gyan(code)

get_national_statistics_fsk()
get_national_statistics_gr()
get_national_statistics_gran()
get_national_statistics_gy()
get_national_statistics_gyan()

get_salsa_statistics_gr()
get_salsa_statistics_gran()

get_program_statistics_gy()
get_program_statistics_gyan()
```

#### Efter (3 verktyg):
```typescript
// Verktyg 1: Skolenhetsstatistik
get_school_unit_statistics({
  code: string,
  schoolType: 'fsk' | 'gr' | 'gran' | 'gy' | 'gyan',
  schoolYear?: string
})

// Verktyg 2: Nationell statistik (inkl. SALSA)
get_national_statistics({
  schoolType: 'fsk' | 'gr' | 'gran' | 'gy' | 'gyan',
  statisticsType?: 'general' | 'salsa' | 'program',
  schoolYear?: string,
  indicator?: string
})

// Verktyg 3: Programspecifik statistik
get_program_statistics({
  schoolType: 'gy' | 'gyan',
  programCode?: string,
  orientation?: string,
  schoolYear?: string
})
```

#### Implementation:
```typescript
// src/tools/planned-education/v4-statistics-consolidated.ts

export const getSchoolUnitStatisticsSchema = {
  code: z.string().describe('Skolenhetskod'),
  schoolType: z.enum(['fsk', 'gr', 'gran', 'gy', 'gyan']).describe('Skoltyp'),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")')
};

export async function getSchoolUnitStatistics(params: {
  code: string;
  schoolType: 'fsk' | 'gr' | 'gran' | 'gy' | 'gyan';
  schoolYear?: string;
}) {
  try {
    const { schoolType, ...queryParams } = params;

    // Route till rätt API-metod baserat på schoolType
    let result;
    switch (schoolType) {
      case 'fsk':
        result = await plannedEducationApi.getSchoolUnitStatisticsFSK(params.code, queryParams);
        break;
      case 'gr':
        result = await plannedEducationApi.getSchoolUnitStatisticsGR(params.code, queryParams);
        break;
      case 'gran':
        result = await plannedEducationApi.getSchoolUnitStatisticsGRAN(params.code, queryParams);
        break;
      case 'gy':
        result = await plannedEducationApi.getSchoolUnitStatisticsGY(params.code, queryParams);
        break;
      case 'gyan':
        result = await plannedEducationApi.getSchoolUnitStatisticsGYAN(params.code, queryParams);
        break;
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          schoolUnitCode: params.code,
          schoolType: schoolType.toUpperCase(),
          statistics: result
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text' as const,
        text: `Fel vid hämtning av ${params.schoolType.toUpperCase()}-statistik: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}
```

### 2. Format-varianter (4 → 2)

#### Före:
```typescript
get_school_unit_survey_nested(code)
get_school_unit_survey_flat(code)
search_education_events_v4(...)
search_compact_education_events_v4(...)
```

#### Efter:
```typescript
get_school_survey({
  code: string,
  format: 'nested' | 'flat',
  surveyYear?: string
})

search_education_events({
  format: 'full' | 'compact',
  schoolUnitCode?: string,
  typeOfSchool?: string,
  // ... alla andra filter
})
```

### 3. Ta bort v3-duplikat (8 verktyg)

**Ta bort dessa:**
- `search_school_units` → använd `search_school_units_v4`
- `get_school_unit_details` → använd `get_school_unit_details_v4`
- `search_school_units_by_name` → merge till v4 med `name` parameter
- `get_school_units_by_status` → merge till v4 med `status` parameter
- `filter_adult_education_by_distance` → merge till `search_adult_education`
- `filter_adult_education_by_pace` → merge till `search_adult_education`
- `get_education_areas` → merge till support data
- `get_directions` → merge till support data

### 4. Sök-konsolidering (3 → 1)

#### Före:
```typescript
search_school_units({name?, status?})
search_school_units_by_name({name})
get_school_units_by_status({status})
```

#### Efter:
```typescript
search_school_units({
  name?: string,
  status?: string,
  municipality?: string,
  // ... alla filter unified
})
```

## Migration Guide

### För användare:

**Statistik:**
```javascript
// ❌ Före v3.0.0
await mcp.call('get_school_unit_statistics_gy', {code: '12345'})
await mcp.call('get_national_statistics_gr', {})
await mcp.call('get_salsa_statistics_gr', {})

// ✅ Efter v3.0.0
await mcp.call('get_school_unit_statistics', {code: '12345', schoolType: 'gy'})
await mcp.call('get_national_statistics', {schoolType: 'gr', statisticsType: 'general'})
await mcp.call('get_national_statistics', {schoolType: 'gr', statisticsType: 'salsa'})
```

**Enkäter:**
```javascript
// ❌ Före
await mcp.call('get_school_unit_survey_nested', {code: '12345'})

// ✅ Efter
await mcp.call('get_school_survey', {code: '12345', format: 'nested'})
```

**Skolenheter:**
```javascript
// ❌ Före
await mcp.call('search_school_units_by_name', {name: 'Vasaskolan'})

// ✅ Efter
await mcp.call('search_school_units', {name: 'Vasaskolan'})
```

## Benefits

### Kvantitativa fördelar:
- **-53% färre verktyg** (64 → 30)
- **-60% mindre ListTools payload** (~50KB → ~20KB)
- **-70% mindre kodduplicering**
- **-80% enklare underhåll** för statistikverktyg

### Kvalitativa fördelar:
- **Bättre UX** - Lättare att hitta rätt verktyg
- **Lättare för LLM** - Färre val att navigera
- **Enklare dokumentation** - Färre verktyg att beskriva
- **Framtidssäker** - Nya skoltyper kräver inga nya verktyg
- **Konsekvent API** - Samma mönster överallt

## Risks & Mitigations

### Risk 1: Breaking change
**Mitigation:**
- Bump till v3.0.0
- Dokumentera migration guide
- Behåll gamla verktyg i 1 version som deprecated

### Risk 2: Mer komplex parameter-validering
**Mitigation:**
- Använd Zod discriminated unions
- Tydliga felmeddelanden vid invalid combinations

### Risk 3: LLM kan ha svårare att välja rätt parameters
**Mitigation:**
- Mycket tydliga beskrivningar i schema
- Exempel i descriptions
- Enum constraints där möjligt

## Implementation Plan

### Fas 1: v3.0.0-beta (2 dagar)
- [ ] Skapa consolidated statistics tools
- [ ] Skapa consolidated format tools
- [ ] Uppdatera tests
- [ ] Beta release för testing

### Fas 2: v3.0.0 (1 dag)
- [ ] Mark v3 tools as deprecated
- [ ] Update CHANGELOG
- [ ] Release v3.0.0

### Fas 3: v4.0.0 (framtida)
- [ ] Ta bort alla deprecated v3 verktyg
- [ ] Final cleanup

## Decision

**Recommendation:** ✅ **APPROVE refactoring**

**Rationale:**
- 53% reduction i verktyg är betydande
- Parameterbaserad konsolidering är MCP-standard
- Breaking change är OK med proper versioning
- Långsiktiga underhållsfördelar är stora

**Next Steps:**
1. Godkänn proposal
2. Skapa feature branch `refactor/consolidate-tools-v3`
3. Implementera Fas 1
4. Test och review
5. Merge och release v3.0.0
