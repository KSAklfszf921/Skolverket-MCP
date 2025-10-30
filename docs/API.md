# API-dokumentation

## Alla Verktyg (29 st)

### Läroplan API (17 verktyg)

#### Ämnen
- `search_subjects` - Sök ämnen med filter
- `get_subject_details` - Hämta fullständig ämnesinformation
- `get_subject_versions` - Se historiska versioner

#### Kurser
- `search_courses` - Sök kurser med omfattande filter
- `get_course_details` - Detaljerad kursinformation med kunskapskrav
- `get_course_versions` - Historiska kursversioner

#### Program
- `search_programs` - Sök gymnasieprogram
- `get_program_details` - Programinformation med inriktningar
- `get_program_versions` - Programversioner över tid

#### Läroplaner
- `search_curriculums` - Sök läroplaner (LGR11, GY11, etc.)
- `get_curriculum_details` - Fullständig läroplan
- `get_curriculum_versions` - Läroplansversioner

#### Stöddata
- `get_school_types` - Lista skoltyper
- `get_types_of_syllabus` - Lista läroplanstyper
- `get_subject_and_course_codes` - Alla ämnes- och kurskoder
- `get_study_path_codes` - Studievägskodar
- `get_api_info` - API-information

### Skolenhetsregistret API (4 verktyg)

- `search_school_units` - Sök skolenheter med filter
- `get_school_unit_details` - Hämta skolenhetsdetaljer
- `get_school_units_by_status` - Filtrera efter status
- `search_school_units_by_name` - Sök efter namn

### Planned Educations API (7 verktyg)

#### Vuxenutbildning
- `search_adult_education` - Sök vuxenutbildningar (YH, SFI, Komvux)
- `get_adult_education_details` - Detaljerad utbildningsinformation
- `filter_adult_education_by_distance` - Filtrera distans/campus
- `filter_adult_education_by_pace` - Filtrera efter studietakt

#### Stöddata
- `get_education_areas` - Hämta utbildningsområden
- `get_directions` - Hämta inriktningar

### Diagnostik (1 verktyg)

- `health_check` - Testa API-anslutningar och systemstatus

## Vanliga Koder och Termer

### Skoltyper
- `GR` - Grundskolan
- `GY` - Gymnasieskolan
- `VUX` - Vuxenutbildning
- `GRSÄR` - Grundsärskolan
- `GYSÄR` - Gymnasiesärskolan

### Utbildningsformer (typeOfSchool)
- `yh` - Yrkeshögskola
- `sfi` - SFI (Svenska för invandrare)
- `komvuxgycourses` - Komvux gymnasiekurser
- `komvuxbasiccourses` - Komvux grundläggande kurser

### Exempel på Koder
- **Kurser**: `MATMAT01c` (Matematik 1c), `SVESVE01` (Svenska 1)
- **Ämnen**: `GRGRMAT01` (Matematik grundskola)
- **Program**: `NA` (Naturvetenskap), `TE` (Teknik), `EK` (Ekonomi)
- **Läroplaner**: `LGR11` (Läroplan för grundskolan 2011), `GY11` (Gymnasiet 2011)

## API-endpoints

Servern använder följande Skolverket API:er:
- **Läroplan API**: `https://api.skolverket.se/syllabus`
- **Skolenhetsregistret**: `https://api.skolverket.se/skolenhetsregistret/v2`
- **Planned Educations**: `https://api.skolverket.se/planned-educations` (v4)
