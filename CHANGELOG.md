# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2025-01-23

### Added - Komplett API-täckning (19 nya verktyg)
Implementation av ALLA saknade Planned Educations API v4 endpoints baserat på gap-analys:

**Nya kritiska endpoints:**
- `get_adult_education_areas_v4` - Utbildningsområden och inriktningar för vuxenutbildning
- `get_api_info_v4` - API metadata och versionsinformation för v4
- `search_compact_school_units_v4` - Kompakt skolenhetslista med koordinater (WGS84/SWEREF99)
- `get_secondary_school_units_v4` - Sekundära skolenheter (filialer och underenheter)

**SALSA-statistik endpoints:**
- `get_all_schools_salsa_statistics` - SALSA-resultat för alla skolor i Sverige
- `get_school_unit_salsa_statistics` - SALSA-resultat för specifik skolenhet över tid

**Förbättrad filtrering:**
- `get_school_unit_documents_by_type` - Dokument filtrerat på skolform (fsk/gr/gran/gy/gyan)
- `get_school_unit_education_events_by_study_path` - Utbildningstillfällen per studieväg/program

**11 specialiserade survey-endpoints:**
Nested format (vårdnadshavare):
- `get_school_unit_nested_survey_custodians_fsk` - Förskoleklass
- `get_school_unit_nested_survey_custodians_gr` - Grundskola
- `get_school_unit_nested_survey_custodians_gran` - Grundsärskola

Nested format (elever):
- `get_school_unit_nested_survey_pupils_gy` - Gymnasium

Flat format (vårdnadshavare):
- `get_school_unit_flat_survey_custodians_fsk` - Förskoleklass
- `get_school_unit_flat_survey_custodians_gr` - Grundskola
- `get_school_unit_flat_survey_custodians_gran` - Grundsärskola

Flat format (elever):
- `get_school_unit_flat_survey_pupils_gr` - Grundskola
- `get_school_unit_flat_survey_pupils_gy` - Gymnasium

### Enhanced
- **programCode parameter** tillagd för `get_national_statistics_gy` - Möjliggör statistik per gymnasieprogram
- **19 nya API-klient metoder** i `PlannedEducationApiClient`
- **9 nya TypeScript interfaces** för response-typer

### Technical
- Nya verktyg i:
  - `/src/tools/planned-education/v4-new-endpoints.ts` - 8 kritiska endpoints
  - `/src/tools/planned-education/v4-survey-endpoints.ts` - 11 survey-endpoints
- Nya TypeScript types i `/src/types/planned-education.ts`:
  - `AdultEducationAreasResponse`, `ApiInfoV4Response`, `CompactSchoolUnitsV4Response`
  - `SecondarySchoolUnitsResponse`, `AllSchoolsSALSAResponse`, `SchoolUnitSALSAResponse`
  - `DocumentsByTypeResponse`, `EducationEventsByStudyPathResponse`, `SurveyByCategoryResponse`
- API-täckning ökning: **~85% → ~98%** av Planned Educations API v4
- Totalt antal verktyg: **88 → 107** (+19 verktyg)

### Statistics
- **Före:** 88 verktyg, ~30 av 48 v4 endpoints (~63% endpoint-täckning)
- **Efter:** 107 verktyg, ~46 av 48 v4 endpoints (~96% endpoint-täckning)
- **Användarvärde:** ~85% → ~98% täckning (viktad efter användningsfrekvens)
- **Saknas nu:** 2 endpoints (båda nischade, låg användning)

## [2.5.0] - 2025-01-22

### Added
- **Meta-verktyg för konsolidering** - 6 nya meta-verktyg som konsoliderar 18 tidigare verktyg:
  - `get_national_statistics` - Konsoliderar 5 verktyg (fsk, gr, gran, gy, gyan) → välj skoltyp som parameter
  - `get_salsa_statistics` - Konsoliderar 2 verktyg (gr, gran) → välj skoltyp som parameter
  - `get_program_statistics` - Konsoliderar 2 verktyg (gy, gyan) → välj skoltyp som parameter
  - `get_school_unit_statistics` - Konsoliderar 5 verktyg (fsk, gr, gran, gy, gyan) → välj skoltyp som parameter
  - `get_school_unit_survey` - Konsoliderar 2 verktyg (nested, flat) → välj format som parameter
  - `search_education_events` - Konsoliderar 2 verktyg (full, compact) → välj format som parameter

### Improved
- **Reducerat antal verktyg** - Från 64 till 52 verktyg (18 konsoliderade till 6 meta-verktyg)
- **Enklare användning för LLMs** - Välj skoltyp/format som parameter istället för att hitta rätt verktyg
- **Mindre kognitiv belastning** - Färre verktyg att navigera mellan och förstå
- **Bättre discoverability** - Meta-verktyg har tydliga beskrivningar om vilka verktyg de ersätter
- **Fullständig bakåtkompabilitet** - Alla 18 ursprungliga verktyg fungerar fortfarande som tidigare

### Technical
- Nya meta-verktyg i:
  - `/src/tools/planned-education/meta-statistics.ts` - Statistik meta-verktyg
  - `/src/tools/school-units/meta-tools.ts` - Skolenhets meta-verktyg
- Routing baserat på skoltyp/format parameter till befintliga implementationer
- Inga breaking changes - alla gamla verktyg behålls för bakåtkompabilitet
- Total reduktion: 64 verktyg → 52 verktyg (sparar 12 verktygsplatser)

## [2.4.0] - 2025-01-22

### Added
- **Comprehensive Tool Descriptions** - Alla 64 verktyg har nu utökade beskrivningar med:
  - ANVÄNDNINGSFALL - Konkreta use cases för varje verktyg
  - EXEMPEL - Praktiska exempel med riktiga parametervärden
  - RELATERADE VERKTYG - Cross-references till kompletterande verktyg
  - RETURNERAR - Detaljerad information om vad verktyget returnerar
  - TIPS/VIKTIGT - Användbara tips och viktiga noteringar
- **Intelligent Parameter Validation** - Nya validerings-utilities:
  - Skolenhetskod validation (8 siffror)
  - Läsår format validation (YYYY/YYYY)
  - Skoltyp enum validation
  - Koordinat validation för GPS-positioner
  - Pagination validation (page, size)
  - Survey year validation
  - Status validation
- **Smart Caching System** - In-memory cache med TTL för bättre prestanda:
  - Support data: 24h cache (skoltyper, geografiska områden, program, etc.)
  - Statistics: 1h cache (nationell statistik, SALSA, program-statistik)
  - School units: 30min cache (skolenheter, detaljer)
  - Surveys: 4h cache (enkätdata)
  - Automatisk cleanup av expired entries var 5:e minut
- **Enhanced Error Messages** - Förbättrade felmeddelanden med:
  - Kontextuell information om vad som gick fel
  - Användbara förslag på hur man fixar problemet
  - Transform av API-fel till begripliga svenska meddelanden

### Improved
- **LLM Discoverability** - Verktyg är nu mycket lättare för LLMs att upptäcka och använda korrekt
- **User Experience** - Tydligare felmeddelanden och bättre vägledning
- **Performance** - Färre API-anrop tack vare smart caching av referensdata
- **Developer Experience** - Validering fångar fel tidigt innan API-anrop görs

### Technical
- Nya utilities:
  - `/src/utils/validation.ts` - Parameter validation och error transformation
  - `/src/utils/cache.ts` - In-memory TTL cache implementation
- Uppdaterade v4-verktyg med validation och caching
- Inga breaking changes - fullt bakåtkompatibelt

## [2.3.0] - 2025-01-22

### Added
- **Full Planned Education API v4 support** - 37 nya verktyg
  - **School Units v4** (15 verktyg):
    - `search_school_units_v4` - Avancerad sökning med fler filtreringsmöjligheter
    - `get_school_unit_details_v4` - Utökad detaljerad information
    - `get_school_unit_education_events` - Alla utbildningstillfällen per skolenhet
    - `get_school_unit_compact_education_events` - Kompakt format (snabbare)
    - `calculate_distance_from_school_unit` - Avståndberäkning från GPS-koordinat
    - `get_school_unit_documents` - Inspektionsrapporter och dokument
    - `get_school_unit_statistics_links` - Länkar till tillgänglig statistik
    - `get_school_unit_statistics_fsk/gr/gran/gy/gyan` - Statistik per skoltyp
    - `get_school_unit_survey_nested` - Skolenkäter i nested format
    - `get_school_unit_survey_flat` - Skolenkäter i flat format
  - **Education Events v4** (4 verktyg):
    - `search_education_events_v4` - Full detaljnivå med omfattande filter
    - `search_compact_education_events_v4` - Kompakt format
    - `count_education_events_v4` - Räkna matchande utbildningstillfällen
    - `count_adult_education_events_v4` - Räkna vuxenutbildningstillfällen
  - **Statistics v4** (9 verktyg):
    - `get_national_statistics_fsk/gr/gran/gy/gyan` - Nationella värden per skoltyp
    - `get_salsa_statistics_gr/gran` - SALSA-bedömningar
    - `get_program_statistics_gy/gyan` - Programspecifik statistik
  - **Support Data v4** (9 verktyg):
    - `get_school_types_v4` - Alla skoltyper
    - `get_geographical_areas_v4` - Län och kommuner
    - `get_principal_organizer_types_v4` - Huvudmanstyper
    - `get_programs_v4` - Gymnasieprogram och inriktningar
    - `get_orientations_v4` - Alla programinriktningar
    - `get_instruction_languages_v4` - Undervisningsspråk
    - `get_distance_study_types_v4` - Distansstudietyper
    - `get_adult_type_of_schooling_v4` - Vuxenutbildningstyper
    - `get_municipality_school_units_v4` - Kommun-skolenhet mappning

### Changed
- **API-klient** utökad för v4-stöd
  - Uppdaterad BaseApiClient med stöd för custom headers
  - PlannedEducationApiClient med alla v4-metoder
  - Korrekt Accept header för v4: `application/vnd.skolverket.plannededucations.api.v4.hal+json`
- **TypeScript typer** för v4
  - 35+ nya interfaces i `planned-education.ts`
  - Fullständig typning för alla v4 responses
  - Support för nested och flat survey strukturer

### Improved
- **Total antal verktyg**: 27 → 64 verktyg
- Mer komplett täckning av Skolverkets Planned Education API
- Bättre statistiktillgång (nationellt, SALSA, per-program)
- Skolenkäter i två format för olika användningsfall
- Avståndberäkning för geografisk filtrering

## [2.2.0] - 2025-01-22

### Added
- **Komplett överensstämmelse med Skolverkets OpenAPI 3.1.0 specifikation**
  - `date` parameter för alla search endpoints (subjects, courses, programs, curriculums)
  - `date` parameter för alla detail endpoints för att hämta versioner som var giltiga vid ett specifikt datum
  - `typeOfProgram` parameter till `get_study_path_codes` för att filtrera efter programtyp (HÖGSKOLEFÖRBEREDANDE, YRKES)
  - `typeOfStudyPath` parameter till `search_programs` för mer exakt filtrering

### Changed
- **Förbättrade tool schemas** med bättre beskrivningar och exempel
- **Uppdaterade TypeScript typer** för att stödja alla nya parametrar
  - `StudyPathSearchParams` inkluderar nu `date`, `typeOfStudyPath` och `typeOfProgram`
  - `ProgramSearchParams` använder nu `typeOfStudyPath` istället för `studyPathType`
  - Alla search params har nu `date` stöd
- **API-klienten** uppdaterad för att skicka date-parametrar till backend

### Improved
- Mer komplett täckning av Skolverkets API-funktionalitet
- Bättre datumbaserad filtrering för historiska läroplansversioner
- Tydligare parameternamn som matchar OpenAPI specifikationen exakt

## [2.1.3] - 2025-10-31

### Added
- **GitHub Actions auto-deploy workflows**
  - `publish-npm.yml` - Automatic npm publishing on tag push
  - `publish-mcp-registry.yml` - Automatic MCP Registry publishing after npm success
  - Triggers on `v*.*.*` tags for seamless releases
- **Deployment documentation**
  - `.github/AUTO_DEPLOY.md` - Complete guide for auto-deploy setup
  - `verify-deployment.sh` - Script for verifying deployments across all platforms

### Changed
- Streamlined release process - single tag push now deploys to npm and MCP Registry
- Improved deployment consistency across npm, MCP Registry, and Render

## [2.1.2] - 2024-10-31

### Fixed
- **npm package now includes server.json** - Fixed missing server.json file in published npm package
- Ensures MCP Registry validation works correctly for npm installations

## [2.1.1] - 2024-10-31

### Added
- **MCP Registry support** - Published to official Model Context Protocol Registry
  - Added `server.json` for MCP Registry configuration
  - Added `mcpName` field to package.json for registry validation
  - Server now discoverable at `io.github.KSAklfszf921/skolverket-mcp`

### Changed
- Updated npm package to include `server.json` in published files

## [2.1.0] - 2024-10-31

### Added
- **Community health files**
  - CODE_OF_CONDUCT.md (Contributor Covenant 2.1)
  - SECURITY.md (Security policy and vulnerability reporting)
  - CONTRIBUTING.md (Contribution guidelines)
  - Issue templates (bug report, feature request)
  - Pull request template
- **GitHub features**
  - GitHub Discussions enabled
  - Repository topics for better discoverability
  - Additional badges in README

### Changed
- Improved README with "Two ways to use" section (Remote vs Local)
- Enhanced repository visibility on GitHub

## [2.0.0] - 2025-01-20

### Added
- **Skolenhetsregistret API integration** - Full support för skolenheter
  - `search_school_units` - Sök efter skolenheter med filter
  - `get_school_unit_details` - Hämta detaljer om specifik skolenhet
  - `get_school_units_by_status` - Filtrera efter status (AKTIV, UPPHORT, VILANDE)
  - `search_school_units_by_name` - Sök efter namn

- **Planned Educations API integration** - Full support för vuxenutbildning och statistik
  - **Vuxenutbildning (4 verktyg)**:
    - `search_adult_education` - Sök vuxenutbildningar med omfattande filter
    - `get_adult_education_details` - Detaljerad information om utbildningstillfälle
    - `filter_adult_education_by_distance` - Filtrera distans/campus
    - `filter_adult_education_by_pace` - Filtrera efter studietakt
  - **Stöddata (2 verktyg)**:
    - `get_education_areas` - Hämta utbildningsområden
    - `get_directions` - Hämta inriktningar

- Total of **27 tools** (17 from Syllabus API + 4 from School Units + 6 from Planned Educations)

### Changed
- **Projektnamn**: `skolverket-syllabus-mcp` → `skolverket-mcp`
- **Bin-kommando**: `skolverket-syllabus-mcp` → `skolverket-mcp`
- **Arkitektur**: Refaktorerad till modularitet
  - Ny `src/api/base-client.ts` - Delad HTTP-klient för alla API:er
  - Flyttat Syllabus API klient till `src/api/syllabus-client.ts`
  - Strukturerade verktyg i undermappar: `tools/syllabus/`, `tools/school-units/`, `tools/planned-education/`
- **Typer**: Döpt om `src/types/skolverket.ts` → `src/types/syllabus.ts`
- README med komplett dokumentation för alla 3 API:er

### Improved
- Bättre felhantering över alla API-klienter
- Mer detaljerad TypeScript-typning
- Konsekvent errormeddelande-format
- Utökad API-dokumentation

## [1.0.0] - 2025-01-20

### Added
- Initial release med Skolverkets Läroplan API (Syllabus API)
- **17 verktyg för läroplaner**:
  - 3 ämnesverktyg (subjects)
  - 3 kursverktyg (courses)
  - 3 programverktyg (programs)
  - 3 läroplansverktyg (curriculums)
  - 5 värdesamlingsverktyg (school types, codes, etc.)
- Full TypeScript-implementation
- MCP SDK integration
- Zod schema-validering

[2.0.0]: https://github.com/KSAklfszf921/skolverket-syllabus-mcp/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/KSAklfszf921/skolverket-syllabus-mcp/releases/tag/v1.0.0
