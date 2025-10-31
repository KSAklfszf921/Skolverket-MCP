# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
