#!/usr/bin/env node

/**
 * Skolverket MCP Server v2.4.0
 *
 * Komplett MCP server för att ge LLMs tillgång till Skolverkets öppna API:er:
 * - Läroplan API (läroplaner, ämnen, kurser, program)
 * - Skolenhetsregistret API (skolenheter och deras status)
 * - Planned Educations API v4 (utbildningstillfällen, statistik, inspektionsrapporter, enkäter)
 *
 * Version 2.4.0 förbättringar:
 * - Kraftigt förbättrade verktygs beskrivningar med användningsfall, exempel och relaterade verktyg
 * - Intelligent validering av parametrar (skolenhetskod, läsår, koordinater, etc.)
 * - Smart caching av referensdata för bättre prestanda
 * - Förbättrade felmeddelanden med kontextuell information
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import logger och errors
import { log } from './logger.js';
import { ResourceNotFoundError } from './errors.js';

// Importera API-klienter
import { syllabusApi } from './api/syllabus-client.js';
import { schoolUnitsApi } from './api/school-units-client.js';
import { plannedEducationApi } from './api/planned-education-client.js';

// Importera läroplanverktyg (Syllabus API)
import {
  searchSubjects,
  getSubjectDetails,
  getSubjectVersions,
  searchSubjectsSchema,
  getSubjectDetailsSchema,
  getSubjectVersionsSchema
} from './tools/syllabus/subjects.js';

import {
  searchCourses,
  getCourseDetails,
  getCourseVersions,
  searchCoursesSchema,
  getCourseDetailsSchema,
  getCourseVersionsSchema
} from './tools/syllabus/courses.js';

import {
  searchPrograms,
  getProgramDetails,
  getProgramVersions,
  searchProgramsSchema,
  getProgramDetailsSchema,
  getProgramVersionsSchema
} from './tools/syllabus/programs.js';

import {
  searchCurriculums,
  getCurriculumDetails,
  getCurriculumVersions,
  searchCurriculumsSchema,
  getCurriculumDetailsSchema,
  getCurriculumVersionsSchema
} from './tools/syllabus/curriculums.js';

import {
  getSchoolTypes,
  getTypesOfSyllabus,
  getSubjectAndCourseCodes,
  getStudyPathCodes,
  getApiInfo,
  getSchoolTypesSchema,
  getStudyPathCodesSchema
} from './tools/syllabus/valuestore.js';

// Importera skolenhetsverktyg (School Units API)
import {
  searchSchoolUnits,
  getSchoolUnitDetails,
  getSchoolUnitsByStatus,
  searchSchoolUnitsByName,
  searchSchoolUnitsSchema,
  getSchoolUnitDetailsSchema,
  getSchoolUnitsByStatusSchema,
  searchSchoolUnitsByNameSchema
} from './tools/school-units/search.js';

// Importera planned education verktyg
import {
  searchAdultEducation,
  getAdultEducationDetails,
  filterAdultEducationByDistance,
  filterAdultEducationByPace,
  searchAdultEducationSchema,
  getAdultEducationDetailsSchema,
  filterAdultEducationByDistanceSchema,
  filterAdultEducationByPaceSchema
} from './tools/planned-education/adult-education.js';

import {
  getEducationAreas,
  getDirections,
  getEducationAreasSchema,
  getDirectionsSchema
} from './tools/planned-education/support-data.js';

// V4 School Units verktyg
import {
  searchSchoolUnitsV4,
  getSchoolUnitDetailsV4,
  getSchoolUnitEducationEvents,
  getSchoolUnitCompactEducationEvents,
  calculateDistanceFromSchoolUnit,
  getSchoolUnitDocuments,
  getSchoolUnitStatisticsLinks,
  getSchoolUnitStatisticsFSK,
  getSchoolUnitStatisticsGR,
  getSchoolUnitStatisticsGRAN,
  getSchoolUnitStatisticsGY,
  getSchoolUnitStatisticsGYAN,
  getSchoolUnitSurveyNested,
  getSchoolUnitSurveyFlat,
  searchSchoolUnitsV4Schema,
  getSchoolUnitDetailsV4Schema,
  getSchoolUnitEducationEventsSchema,
  getSchoolUnitCompactEducationEventsSchema,
  calculateDistanceFromSchoolUnitSchema,
  getSchoolUnitDocumentsSchema,
  getSchoolUnitStatisticsLinksSchema,
  getSchoolUnitStatisticsFSKSchema,
  getSchoolUnitStatisticsGRSchema,
  getSchoolUnitStatisticsGRANSchema,
  getSchoolUnitStatisticsGYSchema,
  getSchoolUnitStatisticsGYANSchema,
  getSchoolUnitSurveyNestedSchema,
  getSchoolUnitSurveyFlatSchema
} from './tools/school-units/v4.js';

// V4 Education Events verktyg
import {
  searchEducationEventsV4,
  searchCompactEducationEventsV4,
  countEducationEventsV4,
  countAdultEducationEventsV4,
  searchEducationEventsV4Schema,
  searchCompactEducationEventsV4Schema,
  countEducationEventsV4Schema,
  countAdultEducationEventsV4Schema
} from './tools/planned-education/v4-education-events.js';

// V4 Statistics verktyg
import {
  getNationalStatisticsFSK,
  getNationalStatisticsGR,
  getNationalStatisticsGRAN,
  getNationalStatisticsGY,
  getNationalStatisticsGYAN,
  getSALSAStatisticsGR,
  getSALSAStatisticsGRAN,
  getProgramStatisticsGY,
  getProgramStatisticsGYAN,
  getNationalStatisticsFSKSchema,
  getNationalStatisticsGRSchema,
  getNationalStatisticsGRANSchema,
  getNationalStatisticsGYSchema,
  getNationalStatisticsGYANSchema,
  getSALSAStatisticsGRSchema,
  getSALSAStatisticsGRANSchema,
  getProgramStatisticsGYSchema,
  getProgramStatisticsGYANSchema
} from './tools/planned-education/v4-statistics.js';

// V4 Support Data verktyg
import {
  getSchoolTypesV4,
  getGeographicalAreasV4,
  getPrincipalOrganizerTypesV4,
  getProgramsV4,
  getOrientationsV4,
  getInstructionLanguagesV4,
  getDistanceStudyTypesV4,
  getAdultTypeOfSchoolingV4,
  getMunicipalitySchoolUnitsV4,
  getSchoolTypesV4Schema,
  getGeographicalAreasV4Schema,
  getPrincipalOrganizerTypesV4Schema,
  getProgramsV4Schema,
  getOrientationsV4Schema,
  getInstructionLanguagesV4Schema,
  getDistanceStudyTypesV4Schema,
  getAdultTypeOfSchoolingV4Schema,
  getMunicipalitySchoolUnitsV4Schema
} from './tools/planned-education/v4-support.js';

// Health check verktyg
import {
  healthCheck,
  healthCheckSchema
} from './tools/health.js';

// Skapa servern med uppdaterade capabilities
const server = new Server(
  {
    name: 'skolverket-mcp',
    version: '2.4.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      logging: {}
    },
  }
);

// ==============================================
// RESOURCES - För kontextläsning
// ==============================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  log.info('Resources list requested');

  return {
    resources: [
      {
        uri: 'skolverket://api/info',
        name: 'Skolverket API Information',
        mimeType: 'application/json',
        description: 'Information om Skolverkets Läroplan API'
      },
      {
        uri: 'skolverket://school-types',
        name: 'Alla skoltyper',
        mimeType: 'application/json',
        description: 'Lista över alla aktiva skoltyper (GR, GY, VUX, etc.)'
      },
      {
        uri: 'skolverket://types-of-syllabus',
        name: 'Typer av läroplaner',
        mimeType: 'application/json',
        description: 'Lista över alla typer av läroplaner'
      },
      {
        uri: 'skolverket://education-areas',
        name: 'Utbildningsområden',
        mimeType: 'application/json',
        description: 'Alla tillgängliga utbildningsområden för vuxenutbildning'
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  log.info('Resource read requested', { uri });

  try {
    switch (uri) {
      case 'skolverket://api/info': {
        const info = await syllabusApi.getApiInfo();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(info, null, 2)
          }]
        };
      }

      case 'skolverket://school-types': {
        const types = await syllabusApi.getSchoolTypes();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(types, null, 2)
          }]
        };
      }

      case 'skolverket://types-of-syllabus': {
        const types = await syllabusApi.getTypesOfSyllabus();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(types, null, 2)
          }]
        };
      }

      case 'skolverket://education-areas': {
        const response = await plannedEducationApi.getEducationAreas();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(response.body, null, 2)
          }]
        };
      }

      default:
        throw new ResourceNotFoundError(uri);
    }
  } catch (error) {
    log.error('Resource read failed', { uri, error });
    throw error;
  }
});

// ==============================================
// PROMPTS - För vanliga användningsfall
// ==============================================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  log.info('Prompts list requested');

  return {
    prompts: [
      {
        name: 'analyze_course',
        description: 'Analysera en kurs med centralt innehåll och kunskapskrav',
        arguments: [
          {
            name: 'course_code',
            description: 'Kurskod (t.ex. MATMAT01c för Matematik 1c)',
            required: true
          }
        ]
      },
      {
        name: 'compare_curriculum_versions',
        description: 'Jämför två versioner av ett ämne eller kurs',
        arguments: [
          {
            name: 'code',
            description: 'Ämnes- eller kurskod att jämföra',
            required: true
          },
          {
            name: 'type',
            description: 'Typ: "subject" eller "course"',
            required: true
          }
        ]
      },
      {
        name: 'find_adult_education',
        description: 'Hitta vuxenutbildningar baserat på kriterier',
        arguments: [
          {
            name: 'search_term',
            description: 'Sökterm (t.ex. "programmering", "svenska")',
            required: false
          },
          {
            name: 'town',
            description: 'Stad (t.ex. "Stockholm", "Göteborg")',
            required: false
          },
          {
            name: 'distance',
            description: 'Distansutbildning? (true/false)',
            required: false
          }
        ]
      },
      {
        name: 'plan_study_path',
        description: 'Hjälp elev planera studieväg på gymnasiet',
        arguments: [
          {
            name: 'interests',
            description: 'Elevens intressen (t.ex. "teknik", "naturvetenskap")',
            required: true
          }
        ]
      },
      {
        name: 'teacher_course_planning',
        description: 'Hjälp lärare planera en kurs',
        arguments: [
          {
            name: 'course_code',
            description: 'Kurskod att planera',
            required: true
          },
          {
            name: 'focus_areas',
            description: 'Fokusområden (valfritt)',
            required: false
          }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  log.info('Prompt requested', { name, args });

  try {
    switch (name) {
    case 'analyze_course': {
      const courseCode = args?.course_code as string;
      if (!courseCode) {
        throw new Error('course_code krävs');
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analysera kursen ${courseCode} genom att:

1. Hämta kursens detaljer med get_course_details
2. Granska det centrala innehållet
3. Analysera kunskapskraven för alla betyg (E, C, A)
4. Identifiera nyckelkompetenser
5. Ge en sammanfattning av kursens omfattning och svårighetsgrad

Börja med att hämta kursdata.`
            }
          }
        ]
      };
    }

    case 'compare_curriculum_versions': {
      const code = args?.code as string;
      const type = args?.type as string;

      if (!code || !type) {
        throw new Error('Både code och type krävs');
      }

      const toolName = type === 'subject' ? 'get_subject_versions' : 'get_course_versions';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Jämför olika versioner av ${code}:

1. Använd ${toolName} för att hämta alla versioner
2. Hämta detaljer för den senaste och näst senaste versionen
3. Jämför centralt innehåll och kunskapskrav
4. Identifiera viktigaste ändringar
5. Sammanfatta hur ${type === 'subject' ? 'ämnet' : 'kursen'} har utvecklats

Börja med att hämta versionshistoriken.`
            }
          }
        ]
      };
    }

    case 'find_adult_education': {
      const searchTerm = args?.search_term as string | undefined;
      const town = args?.town as string | undefined;
      const distance = args?.distance as boolean | undefined;

      const filters: string[] = [];
      if (searchTerm) filters.push(`sökterm: "${searchTerm}"`);
      if (town) filters.push(`stad: "${town}"`);
      if (distance !== undefined) filters.push(`distans: ${distance ? 'ja' : 'nej'}`);

      const filterText = filters.length > 0 ? ` med filter: ${filters.join(', ')}` : '';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Hitta vuxenutbildningar${filterText}:

1. Använd search_adult_education med lämpliga filter
2. Analysera resultaten och sortera efter relevans
3. För varje träff, visa:
   - Utbildningens namn
   - Anordnare
   - Plats och distansalternativ
   - Starttider
   - Studietakt
4. Ge rekommendationer baserat på kriterierna

Börja med att söka efter utbildningar.`
            }
          }
        ]
      };
    }

    case 'plan_study_path': {
      const interests = args?.interests as string;
      if (!interests) {
        throw new Error('interests krävs');
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Hjälp en elev som är intresserad av "${interests}" att planera sin studieväg:

1. Använd search_programs för att hitta relevanta gymnasieprogram
2. För varje relevant program, använd get_program_details för att se:
   - Inriktningar
   - Profiler
   - Yrkesutfall
   - Kurser som ingår
3. Jämför programmen utifrån elevens intressen
4. Ge konkreta rekommendationer för:
   - Vilket program som passar bäst
   - Vilka inriktningar/profiler att överväga
   - Vilka framtida karriärvägar som öppnas

Börja med att söka efter lämpliga program.`
            }
          }
        ]
      };
    }

    case 'teacher_course_planning': {
      const courseCode = args?.course_code as string;
      const focusAreas = args?.focus_areas as string | undefined;

      if (!courseCode) {
        throw new Error('course_code krävs');
      }

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Hjälp lärare planera kursen ${courseCode}${focusAreas ? ` med fokus på ${focusAreas}` : ''}:

1. Hämta kursens detaljer med get_course_details
2. Analysera det centrala innehållet
3. Granska kunskapskraven
4. Föreslå:
   - Tematisk upplägg
   - Lärandeaktiviteter för varje del
   - Bedömningspunkter
   - Hur man arbetar mot olika betygsnivåer (E, C, A)
5. Skapa en övergripande kursplan med tidsestimat

Börja med att hämta kursdata.`
            }
          }
        ]
      };
    }

      default:
        throw new Error(`Okänd prompt: ${name}`);
    }
  } catch (error) {
    log.error('Prompt execution failed', { name, error });
    throw error;
  }
});

// ==============================================
// TOOLS - Med förbättrade beskrivningar
// ==============================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  log.info('Tools list requested');

  return {
    tools: [
      // ==============================================
      // LÄROPLAN API VERKTYG (Syllabus API)
      // ==============================================

      // Ämnesverktyg
      {
        name: 'search_subjects',
        description: `Sök efter ämnen i Skolverkets läroplan.

ANVÄNDNINGSFALL:
- Hitta ämnen för en specifik skoltyp (grundskola, gymnasium, etc.)
- Jämföra ämnen över tid (senaste, historiska, alla versioner)
- Utforska ämnens struktur och innehåll

RETURNERAR: Lista över ämnen med kod, namn, beskrivning och version.

EXEMPEL: För att hitta alla ämnen i gymnasiet, använd schooltype="GY" och timespan="LATEST".`,
        inputSchema: {
          type: 'object',
          properties: searchSubjectsSchema,
        },
      },
      {
        name: 'get_subject_details',
        description: `Hämta detaljerad information om ett specifikt ämne.

ANVÄNDNINGSFALL:
- Se centralt innehåll för ett ämne
- Granska ämnesspecifika kunskapskrav
- Förstå ämnets uppbyggnad och progression
- Planera undervisning

RETURNERAR: Komplett ämnesinformation med alla detaljer, inkl. kurser som ingår.

EXEMPEL: Använd code="GRGRMAT01" för Matematik i grundskolan.`,
        inputSchema: {
          type: 'object',
          properties: getSubjectDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_subject_versions',
        description: `Hämta alla tillgängliga versioner av ett ämne.

ANVÄNDNINGSFALL:
- Följa hur ett ämne förändrats över tid
- Jämföra nuvarande läroplan med tidigare versioner
- Forskning om läroplansförändringar
- Förstå progressionen i ämnets utveckling

RETURNERAR: Lista över alla versioner med versionsnummer och giltighetsdatum.

TIPS: Använd sedan get_subject_details med specifikt versionsnummer för att jämföra.`,
        inputSchema: {
          type: 'object',
          properties: getSubjectVersionsSchema,
          required: ['code'],
        },
      },

      // Kursverktyg
      {
        name: 'search_courses',
        description: `Sök efter kurser i Skolverkets läroplan.

ANVÄNDNINGSFALL:
- Hitta kurser inom ett specifikt ämne
- Filtrera kurser efter skoltyp och tidsperiod
- Bygga upp kursutbud
- Planera studiegång

RETURNERAR: Lista över kurser med kod, namn, poäng och beskrivning.

EXEMPEL: För Matematik 1c på gymnasiet, sök med schooltype="GY" och subjectCode="MATMAT01c".

TIPS: Använd subjectCode för att filtrera på ämne.`,
        inputSchema: {
          type: 'object',
          properties: searchCoursesSchema,
        },
      },
      {
        name: 'get_course_details',
        description: `Hämta detaljerad information om en specifik kurs.

ANVÄNDNINGSFALL:
- Granska centralt innehåll för kursplanering
- Analysera kunskapskrav för alla betyg (E, C, A)
- Förstå kursmål och syfte
- Planera bedömning och examination

RETURNERAR: Komplett kursinformation inkl:
- Centralt innehåll per område
- Kunskapskrav för E, C och A
- Poäng och omfattning
- Syfte och mål

EXEMPEL: code="MATMAT01c" för Matematik 1c.

VIKTIGT: Detta är den mest använda funktionen för lärare!`,
        inputSchema: {
          type: 'object',
          properties: getCourseDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_course_versions',
        description: `Hämta alla versioner av en kurs.

ANVÄNDNINGSFALL:
- Spåra förändringar i kursen över tid
- Jämföra gamla och nya läroplaner
- Forskning och analys
- Förstå hur krav och innehåll utvecklats

RETURNERAR: Versionshistorik med versionsnummer och datum.`,
        inputSchema: {
          type: 'object',
          properties: getCourseVersionsSchema,
          required: ['code'],
        },
      },

      // Programverktyg
      {
        name: 'search_programs',
        description: `Sök efter gymnasieprogram och studievägar.

ANVÄNDNINGSFALL:
- Studie- och yrkesvägledning
- Hjälpa elever välja program
- Jämföra olika studievägar
- Utforska inriktningar och profiler

RETURNERAR: Lista över program med inriktningar, profiler och beskrivning.

EXEMPEL: För gymnasieprogram, använd schooltype="GY" och timespan="LATEST".`,
        inputSchema: {
          type: 'object',
          properties: searchProgramsSchema,
        },
      },
      {
        name: 'get_program_details',
        description: `Hämta detaljerad information om ett specifikt program.

ANVÄNDNINGSFALL:
- Djupdyka i programstruktur
- Se alla inriktningar och profiler
- Förstå yrkesutfall och karriärvägar
- Planera studieväg
- Vägledning och rådgivning

RETURNERAR: Komplett programinformation inkl:
- Alla inriktningar
- Profiler och specialiseringar
- Yrkesutfall och fortsatta studier
- Programspecifika kurser

EXEMPEL: code="NA" för Naturvetenskapsprogrammet, "TE" för Teknikprogrammet.`,
        inputSchema: {
          type: 'object',
          properties: getProgramDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_program_versions',
        description: `Hämta versionshistorik för ett program.

ANVÄNDNINGSFALL:
- Spåra hur program förändrats
- Jämföra gamla och nya programplaner
- Förstå utveckling av yrkesutbildningar

RETURNERAR: Lista över alla versioner med datum.`,
        inputSchema: {
          type: 'object',
          properties: getProgramVersionsSchema,
          required: ['code'],
        },
      },

      // Läroplansverktyg
      {
        name: 'search_curriculums',
        description: `Sök efter läroplaner (t.ex. LGR11, GY11).

ANVÄNDNINGSFALL:
- Hitta gällande läroplaner
- Jämföra läroplaner mellan skolformer
- Förstå läroplanernas struktur

RETURNERAR: Lista över läroplaner med kod, namn och giltighetsperiod.

EXEMPEL: LGR11 (Läroplan för grundskolan 2011), GY11 (Gymnasiet 2011).`,
        inputSchema: {
          type: 'object',
          properties: searchCurriculumsSchema,
        },
      },
      {
        name: 'get_curriculum_details',
        description: `Hämta komplett läroplan med alla avsnitt.

ANVÄNDNINGSFALL:
- Läsa läroplanens värdegrund och uppdrag
- Granska övergripande mål
- Förstå skolformens ramar
- Planera verksamhet

RETURNERAR: Hela läroplanen med alla kapitel och avsnitt.

EXEMPEL: code="LGR11" för grundskolans läroplan.`,
        inputSchema: {
          type: 'object',
          properties: getCurriculumDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_curriculum_versions',
        description: `Hämta versionshistorik för en läroplan.

ANVÄNDNINGSFALL:
- Spåra revideringar av läroplaner
- Jämföra olika versioner
- Forskning om läroplansutveckling

RETURNERAR: Lista över versioner med datum.`,
        inputSchema: {
          type: 'object',
          properties: getCurriculumVersionsSchema,
          required: ['code'],
        },
      },

      // Värdesamlingsverktyg
      {
        name: 'get_school_types',
        description: `Hämta lista över alla skoltyper.

ANVÄNDNINGSFALL:
- Se tillgängliga skolformer
- Förstå Skolverkets kategorisering
- Filtrera data efter skoltyp

RETURNERAR: Lista över skoltyper med koder och namn.

VÄRDEN: GR (Grundskola), GY (Gymnasium), VUX (Vuxenutbildning), GRSÄR (Grundsärskola), GYSÄR (Gymnasiesärskola).`,
        inputSchema: {
          type: 'object',
          properties: getSchoolTypesSchema,
        },
      },
      {
        name: 'get_types_of_syllabus',
        description: `Hämta alla typer av läroplaner.

ANVÄNDNINGSFALL:
- Förstå olika läroplansk kategorier
- Filtrera sökningar

RETURNERAR: Lista över läroplanstyper.`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_subject_and_course_codes',
        description: `Hämta alla tillgängliga ämnes- och kurskoder.

ANVÄNDNINGSFALL:
- Utforska hela kursutbudet
- Hitta rätt kod för sökning
- Bygga översikter

RETURNERAR: Komplett lista över alla koder med typ (subject/course).

OBS: Stor datamängd, kan ta tid att ladda.`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_study_path_codes',
        description: `Hämta studievägskodar (programkoder).

ANVÄNDNINGSFALL:
- Lista alla gymnasieprogram
- Hitta programkoder
- Filtrera efter typ

RETURNERAR: Lista över studievägar med koder.`,
        inputSchema: {
          type: 'object',
          properties: getStudyPathCodesSchema,
        },
      },
      {
        name: 'get_api_info',
        description: `Hämta information om Skolverkets Läroplan API.

ANVÄNDNINGSFALL:
- Se API-version
- Kontakta information
- Teknisk dokumentation

RETURNERAR: API-metadata och information.`,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // ==============================================
      // SKOLENHETSREGISTRET API VERKTYG
      // ==============================================

      {
        name: 'search_school_units',
        description: `Sök efter skolenheter med filter.

ANVÄNDNINGSFALL:
- Hitta skolor i ett område
- Filtrera efter status (aktiva, nedlagda, vilande)
- Bygga skolregister
- Planering och analys

RETURNERAR: Lista över skolenheter med kod, namn och status.

EXEMPEL: Sök aktiva skolor med status="AKTIV".`,
        inputSchema: {
          type: 'object',
          properties: searchSchoolUnitsSchema,
        },
      },
      {
        name: 'get_school_unit_details',
        description: `Hämta detaljer om en specifik skolenhet.

ANVÄNDNINGSFALL:
- Se skolans fullständiga information
- Kontrollera skolstatus
- Verifiera skolenhetskod

RETURNERAR: Komplett skolenhetsinfo inkl. namn, adress, status.

EXEMPEL: Använd skolenhetskod (8 siffror).`,
        inputSchema: {
          type: 'object',
          properties: getSchoolUnitDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_school_units_by_status',
        description: `Filtrera skolenheter efter status.

ANVÄNDNINGSFALL:
- Hitta aktiva skolor
- Lista nedlagda skolor
- Spåra vilande enheter
- Statistik och analys

RETURNERAR: Skolenheter med angiven status.

STATUS: AKTIV, UPPHORT (nedlagd), VILANDE.`,
        inputSchema: {
          type: 'object',
          properties: getSchoolUnitsByStatusSchema,
          required: ['status'],
        },
      },
      {
        name: 'search_school_units_by_name',
        description: `Sök skolenheter efter namn.

ANVÄNDNINGSFALL:
- Hitta specifik skola
- Filtrera efter namnmönster
- Identifiera skolgrupper

RETURNERAR: Skolenheter som matchar söktermen (delmatchning).

TIPS: Fungerar med partiella namn.`,
        inputSchema: {
          type: 'object',
          properties: searchSchoolUnitsByNameSchema,
          required: ['name'],
        },
      },

      // ==============================================
      // PLANNED EDUCATIONS API VERKTYG
      // ==============================================

      // Vuxenutbildning
      {
        name: 'search_adult_education',
        description: `Sök vuxenutbildningar med omfattande filter.

ANVÄNDNINGSFALL:
- Hitta YH-utbildningar (Yrkeshögskola)
- Sök SFI-kurser (Svenska för invandrare)
- Hitta Komvux-kurser
- Filtrera efter stad, distans, studietakt
- Planera vidareutbildning

RETURNERAR: Utbildningstillfällen med:
- Titel och anordnare
- Plats och kommun
- Distans/campus
- Starttider
- Studietakt och omfattning

FILTER:
- searchTerm: Sökord (t.ex. "programmering")
- town: Stad (t.ex. "Stockholm")
- typeOfSchool: "yh", "sfi", "komvuxgycourses"
- distance: "true"/"false"
- paceOfStudy: "100" (heltid), "50" (halvtid)

EXEMPEL: Hitta IT-utbildningar i Stockholm som är på heltid.`,
        inputSchema: {
          type: 'object',
          properties: searchAdultEducationSchema,
        },
      },
      {
        name: 'get_adult_education_details',
        description: `Hämta detaljerad information om ett utbildningstillfälle.

ANVÄNDNINGSFALL:
- Se fullständig kursinformation
- Läsa kursplan
- Kontrollera antagningskrav
- Planera ansökan

RETURNERAR: Komplett utbildningsinfo inkl. innehåll och krav.

EXEMPEL: Använd ID från search_adult_education.`,
        inputSchema: {
          type: 'object',
          properties: getAdultEducationDetailsSchema,
          required: ['id'],
        },
      },
      {
        name: 'filter_adult_education_by_distance',
        description: `Filtrera utbildningar på distans eller campus.

ANVÄNDNINGSFALL:
- Hitta endast distansutbildningar
- Filtrera bort distansalternativ
- Planera studiealternativ baserat på plats

RETURNERAR: Filtrerade utbildningar.

EXEMPEL: distance=true för endast distansutbildningar.`,
        inputSchema: {
          type: 'object',
          properties: filterAdultEducationByDistanceSchema,
          required: ['distance'],
        },
      },
      {
        name: 'filter_adult_education_by_pace',
        description: `Filtrera utbildningar efter studietakt.

ANVÄNDNINGSFALL:
- Hitta heltidsutbildningar (100%)
- Sök deltidsalternativ (50%, 25%)
- Anpassa efter arbetssituation

RETURNERAR: Utbildningar med angiven studietakt.

VÄRDEN: "100" (heltid), "50" (halvtid), "25" (kvartsfart), "50-100" (intervall).`,
        inputSchema: {
          type: 'object',
          properties: filterAdultEducationByPaceSchema,
          required: ['paceOfStudy'],
        },
      },

      // Stöddata
      {
        name: 'get_education_areas',
        description: `Hämta alla utbildningsområden.

ANVÄNDNINGSFALL:
- Se tillgängliga områden
- Filtrera utbildningssökningar
- Utforska utbildningsutbud

RETURNERAR: Lista över utbildningsområden.`,
        inputSchema: {
          type: 'object',
          properties: getEducationAreasSchema,
        },
      },
      {
        name: 'get_directions',
        description: `Hämta alla inriktningar för utbildningar.

ANVÄNDNINGSFALL:
- Se specialiseringar
- Filtrera utbildningar
- Utforska inriktningar

RETURNERAR: Lista över inriktningar.`,
        inputSchema: {
          type: 'object',
          properties: getDirectionsSchema,
        },
      },

      // ==============================================
      // V4 API VERKTYG - SCHOOL UNITS
      // ==============================================
      {
        name: 'search_school_units_v4',
        description: `Sök skolenheter med utökade v4-funktioner.

ANVÄNDNINGSFALL:
- Hitta skolor i specifik kommun eller län
- Filtrera efter huvudmanstyp (kommunal, enskild, landsting)
- Sök aktiva/nedlagda/vilande enheter
- Bygga skolregister med avancerade filter
- Geografisk analys av skollandskap

RETURNERAR:
- Paginerad lista med skolenheter
- Detaljerad information per skolenhet
- Stöd för sortering och filtrering
- HAL-länkar för navigation

FILTER:
- name: Skolnamn (partiell matchning)
- municipality/municipalityCode: Kommun
- county/countyCode: Län
- status: AKTIV, UPPHÖRD, VILANDE
- schoolType: Skoltyp
- principalOrganizerType: Huvudmanstyp
- geographicalAreaCode: Geografisk kod

EXEMPEL:
- municipality: "Stockholm", status: "AKTIV"
- schoolType: "Grundskola", principalOrganizerType: "Kommunal"

RELATERADE VERKTYG:
- get_school_unit_details_v4: Hämta detaljer om funnen skolenhet
- get_geographical_areas_v4: Se tillgängliga geografiska områden
- get_principal_organizer_types_v4: Se huvudmanstyper`,
        inputSchema: { type: 'object', properties: searchSchoolUnitsV4Schema },
      },
      {
        name: 'get_school_unit_details_v4',
        description: `Hämta fullständig information om en specifik skolenhet.

ANVÄNDNINGSFALL:
- Verifiera skolenhetskod innan statistikhämtning
- Se fullständig kontaktinformation
- Kontrollera skolstatus och skoltyper
- Granska skolans adress och koordinater
- Identifiera huvudman

RETURNERAR:
- Komplett skolenhetsinformation
- Namn, adress, GPS-koordinater
- Skoltyper och status
- Huvudmansinformation
- HAL-länkar till relaterad data (statistik, enkäter, dokument)

EXEMPEL:
- code: "29824923" (8-siffrig skolenhetskod)
- code: "10015408" (Vasaskolan Stockholm)

RELATERADE VERKTYG:
- search_school_units_v4: Hitta skolenhetskod först
- get_school_unit_statistics_links: Se tillgänglig statistik
- get_school_unit_documents: Hämta inspektionsrapporter

TIPS: Använd detta verktyg först för att verifiera att skolenheten finns innan du hämtar statistik eller enkäter.`,
        inputSchema: { type: 'object', properties: getSchoolUnitDetailsV4Schema, required: ['code'] },
      },
      {
        name: 'get_school_unit_education_events',
        description: `Hämta utbildningstillfällen som erbjuds av en skolenhet.

ANVÄNDNINGSFALL:
- Se vilka utbildningar en skola erbjuder
- Jämföra utbildningsutbud mellan skolor
- Hitta specifika program/inriktningar
- Planera skolval baserat på utbud
- Analysera skolors profileringar

RETURNERAR:
- Paginerad lista med utbildningstillfällen
- Program, inriktningar, kurser
- Startdatum och studieform
- Undervisningsspråk
- Distans/campusinformation

FILTER:
- typeOfSchool: Skoltyp
- distance: true/false (distansutbildning)
- paceOfStudy: Studietakt
- semesterStartFrom: Startdatum (YYYY-MM-DD)

EXEMPEL:
- code: "29824923", typeOfSchool: "Gymnasium"
- code: "10015408", distance: false

RELATERADE VERKTYG:
- get_school_unit_compact_education_events: Snabbare, kompakt format
- search_education_events_v4: Sök över alla skolor
- get_school_unit_details_v4: Se skolinformation först`,
        inputSchema: { type: 'object', properties: getSchoolUnitEducationEventsSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_compact_education_events',
        description: `Hämta utbildningstillfällen i kompakt format (snabbare respons).

ANVÄNDNINGSFALL:
- Snabb översikt över skolans utbud
- När full detaljnivå inte behövs
- Bygga listor och översikter
- Prestanda-optimerad hämtning

RETURNERAR:
- Kompakt representation av utbildningstillfällen
- Mindre datamängd än full version
- Snabbare responstid
- Grundläggande information om varje tillfälle

EXEMPEL:
- code: "29824923"
- code: "10015408", size: 50 (hämta fler resultat)

RELATERADE VERKTYG:
- get_school_unit_education_events: Full detaljnivå
- search_compact_education_events_v4: Sök över alla skolor
- get_school_unit_details_v4: Grundinformation om skolan

TIPS: Använd detta verktyg för snabba översikter, använd den fullständiga varianten när du behöver detaljerad information.`,
        inputSchema: { type: 'object', properties: getSchoolUnitCompactEducationEventsSchema, required: ['code'] },
      },
      {
        name: 'calculate_distance_from_school_unit',
        description: `Beräkna avstånd från en skolenhet till en GPS-koordinat.

ANVÄNDNINGSFALL:
- Hitta närmaste skola från en adress
- Beräkna reseavstånd för elever
- Geografisk analys av skolnätverk
- Planera skolskjutsar
- Skolvalsstöd baserat på avstånd

RETURNERAR:
- Avstånd i meter och kilometer
- Reslinje (fågelvägen)
- GPS-koordinater för båda punkterna

EXEMPEL:
- code: "29824923", latitude: 59.3293, longitude: 18.0686 (Stockholm centrum)
- code: "10015408", latitude: 57.7089, longitude: 11.9746 (Göteborg)

RELATERADE VERKTYG:
- search_school_units_v4: Hitta skolor i närområdet
- get_school_unit_details_v4: Se skolans exakta koordinater

TIPS: Kombinera med search_school_units_v4 för att först hitta skolor i ett område, sedan beräkna exakt avstånd.`,
        inputSchema: { type: 'object', properties: calculateDistanceFromSchoolUnitSchema, required: ['code', 'latitude', 'longitude'] },
      },
      {
        name: 'get_school_unit_documents',
        description: `Hämta dokument kopplade till en skolenhet (t.ex. inspektionsrapporter).

ANVÄNDNINGSFALL:
- Läsa Skolinspektionens rapporter
- Granska tillsynsbeslut
- Få kvalitetsbedömningar
- Forskning om skolkvalitet
- Följa upp granskningar

RETURNERAR:
- Paginerad lista med dokument
- Dokumenttyp (inspektion, beslut, etc.)
- Datum och beskrivning
- Länkar till dokumenten

EXEMPEL:
- code: "29824923"
- code: "10015408", page: 0, size: 10

RELATERADE VERKTYG:
- get_school_unit_details_v4: Grundinformation om skolan
- get_school_unit_statistics_gy/gr: Jämför med statistiska resultat

TIPS: Inspektionsrapporter ger värdefull kvalitetsinformation som kompletterar statistikdata.`,
        inputSchema: { type: 'object', properties: getSchoolUnitDocumentsSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_statistics_links',
        description: `Hämta länkar till tillgänglig statistik för en skolenhet.

ANVÄNDNINGSFALL:
- Upptäcka vilka statistiktyper som finns
- Se vilka läsår som har data
- Planera statistikhämtning
- Verifiera datatillgänglighet

RETURNERAR:
- HAL-länkar till statistikendpoints
- Tillgängliga skoltyper (FSK, GR, GY, etc.)
- Metadata om statistiken

EXEMPEL:
- code: "29824923"
- code: "10015408"

RELATERADE VERKTYG:
- get_school_unit_statistics_gy/gr/fsk/gran/gyan: Hämta specifik statistik
- get_school_unit_details_v4: Verifiera skoltyp först

TIPS: Använd detta verktyg först för att se vilken statistik som är tillgänglig, sedan hämta den specifika typen.`,
        inputSchema: { type: 'object', properties: getSchoolUnitStatisticsLinksSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_statistics_fsk',
        description: `Hämta förskolans kvalitetsstatistik för en skolenhet.

ANVÄNDNINGSFALL:
- Analysera förskolors kvalitet
- Jämföra förskolor i en kommun
- Följa utveckling över läsår
- Skolvalsstöd för föräldrar

RETURNERAR:
- Förskolspecifik statistik
- Gruppstorlek och personaltäthet
- Pedagogisk kvalitet
- Läsårsspecifika värden

EXEMPEL:
- code: "12345678", schoolYear: "2023/2024"
- code: "87654321" (senaste läsår)

RELATERADE VERKTYG:
- get_national_statistics_fsk: Jämför med rikssnitt
- search_school_units_v4: Hitta förskolor först
- get_school_unit_details_v4: Verifiera att det är en förskola

TIPS: Använd schoolYear-parametern för att jämföra utveckling över tid.`,
        inputSchema: { type: 'object', properties: getSchoolUnitStatisticsFSKSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_statistics_gr',
        description: `Hämta grundskolestatistik för en skolenhet.

ANVÄNDNINGSFALL:
- Analysera grundskolors resultat
- Jämföra skolor i området
- Följa betygutveckling
- Nationella prov resultat
- Skolvalsstöd

RETURNERAR:
- Meritvärde (genomsnittliga betyg)
- Behörighet till gymnasiet
- Nationella prov resultat per ämne
- Andel elever med betyg i alla ämnen
- Läsårsspecifik data

EXEMPEL:
- code: "29824923", schoolYear: "2023/2024"
- code: "10015408" (senaste läsår)

RELATERADE VERKTYG:
- get_national_statistics_gr: Jämför med rikssnitt
- get_salsa_statistics_gr: Detaljerad ämnesstatistik
- search_school_units_v4: Hitta grundskolor

VIKTIGT: Detta är en av de mest använda funktionerna för skolval och kvalitetsbedömning!`,
        inputSchema: { type: 'object', properties: getSchoolUnitStatisticsGRSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_statistics_gran',
        description: `Hämta grundsärskolans statistik för en skolenhet.

ANVÄNDNINGSFALL:
- Analysera grundsärskolors kvalitet
- Jämföra särskolor
- Specialpedagogisk uppföljning
- Resursplanering

RETURNERAR:
- Grundsärskolespecifik statistik
- Elevunderlag och gruppstorlekar
- Utbildningsresultat
- Läsårsdata

EXEMPEL:
- code: "12345678", schoolYear: "2023/2024"
- code: "87654321"

RELATERADE VERKTYG:
- get_national_statistics_gran: Riksgenomsnitt
- get_salsa_statistics_gran: Ämnesstatistik
- search_school_units_v4: Hitta grundsärskolor`,
        inputSchema: { type: 'object', properties: getSchoolUnitStatisticsGRANSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_statistics_gy',
        description: `Hämta gymnasiestatistik för en skolenhet.

ANVÄNDNINGSFALL:
- Jämföra gymnasieskolor
- Analysera examensstatistik
- Studieresultat och genomströmning
- Behörighet till högskola
- Skolvalsstöd

RETURNERAR:
- Genomsnittligt meritvärde
- Examensgrad (andel som tar examen)
- Behörighet till högskola per program
- Studieavbrott och byten
- Programspecifik statistik
- Läsårsdata

EXEMPEL:
- code: "29824923", schoolYear: "2023/2024"
- code: "10015408"

RELATERADE VERKTYG:
- get_national_statistics_gy: Jämför med rikssnitt
- get_program_statistics_gy: Detaljerad programstatistik
- search_school_units_v4: Hitta gymnasieskolor
- get_school_unit_education_events: Se vilka program som erbjuds

VIKTIGT: Examensgrad och högskolebehörighet är nyckeltal för gymnasieval!`,
        inputSchema: { type: 'object', properties: getSchoolUnitStatisticsGYSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_statistics_gyan',
        description: `Hämta gymnasiesärskolans statistik för en skolenhet.

ANVÄNDNINGSFALL:
- Analysera gymnasiesärskolors kvalitet
- Jämföra särskolor på gymnasienivå
- Uppföljning av anpassad utbildning
- Resursplanering

RETURNERAR:
- Gymnasiesärskolespecifik statistik
- Utbildningsresultat
- Programgenomströmning
- Läsårsdata

EXEMPEL:
- code: "12345678", schoolYear: "2023/2024"
- code: "87654321"

RELATERADE VERKTYG:
- get_national_statistics_gyan: Riksgenomsnitt
- get_program_statistics_gyan: Programstatistik
- search_school_units_v4: Hitta gymnasiesärskolor`,
        inputSchema: { type: 'object', properties: getSchoolUnitStatisticsGYANSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_survey_nested',
        description: `Hämta skolenkätdata i nested (hierarkisk) struktur.

ANVÄNDNINGSFALL:
- Analysera elevers/föräldrars/lärares upplevelser
- Jämföra skolklimat mellan skolor
- Läsa strukturerad enkätdata med kategorier
- Forskningsanalys av skolmiljö

RETURNERAR:
- Hierarkiskt strukturerad enkätdata
- Kategorier och underkategorier
- Frågor med svarsfrekvenser
- Läsårsspecifika enkäter

STRUKTUR:
- Områden (t.ex. "Trygghet", "Studiero")
  - Frågor per område
    - Svarsfördelning

EXEMPEL:
- code: "29824923", surveyYear: "2023"
- code: "10015408"

RELATERADE VERKTYG:
- get_school_unit_survey_flat: Samma data i platt format
- get_school_unit_statistics_gy/gr: Komplettera med resultatdata

TIPS: Använd nested format när du vill analysera enkätdata per kategori/område.`,
        inputSchema: { type: 'object', properties: getSchoolUnitSurveyNestedSchema, required: ['code'] },
      },
      {
        name: 'get_school_unit_survey_flat',
        description: `Hämta skolenkätdata i flat (platt) struktur.

ANVÄNDNINGSFALL:
- Enkel databehandling och export
- Snabb översikt av alla frågor
- Excel/databas-import
- Statistisk analys utan hierarki

RETURNERAR:
- Platt lista med alla enkätfrågor
- En rad per fråga
- Svarsfördelning per fråga
- Lättare att processa programmatiskt

STRUKTUR:
- Array med frågor
- Varje fråga har text och svar

EXEMPEL:
- code: "29824923", surveyYear: "2023"
- code: "10015408"

RELATERADE VERKTYG:
- get_school_unit_survey_nested: Samma data i hierarkisk struktur
- get_school_unit_statistics_gy/gr: Resultatstatistik

TIPS: Använd flat format för enklare databehandling, nested för analys per kategori.`,
        inputSchema: { type: 'object', properties: getSchoolUnitSurveyFlatSchema, required: ['code'] },
      },

      // ==============================================
      // V4 API VERKTYG - EDUCATION EVENTS
      // ==============================================
      {
        name: 'search_education_events_v4',
        description: `Sök utbildningstillfällen över hela Sverige med omfattande filter.

ANVÄNDNINGSFALL:
- Hitta specifika program/kurser oavsett skola
- Filtrera utbildningar efter plats och attribut
- Jämföra utbildningsutbud mellan regioner
- Hitta distansutbildningar
- Planera studieval med detaljerad information

RETURNERAR:
- Paginerad lista med utbildningstillfällen
- Fullständig information om varje tillfälle
- Program, inriktningar, kurser
- Undervisningsspråk och studieform
- Skolenhetsinformation
- Startdatum och terminer

OMFATTANDE FILTER:
- schoolUnitCode: Specifik skola
- typeOfSchool: Skoltyp
- municipality/county: Plats
- distance: Distansutbildning (true/false)
- paceOfStudy: Studietakt
- programCode: Programkod (t.ex. "NA", "TE")
- orientationCode: Inriktningskod
- instructionLanguages: Undervisningsspråk
- searchTerm: Fritextsökning
- semesterStartFrom: Startdatum (YYYY-MM-DD)

EXEMPEL:
- programCode: "NA", municipality: "Stockholm"
- distance: true, paceOfStudy: "100"
- searchTerm: "naturvetenskap", county: "Stockholms län"

RELATERADE VERKTYG:
- search_compact_education_events_v4: Snabbare, mindre data
- count_education_events_v4: Räkna träffar först
- get_programs_v4: Se tillgängliga programkoder`,
        inputSchema: { type: 'object', properties: searchEducationEventsV4Schema },
      },
      {
        name: 'search_compact_education_events_v4',
        description: `Sök utbildningstillfällen i kompakt format för snabbare respons.

ANVÄNDNINGSFALL:
- Snabb översikt över tillgängliga utbildningar
- Bygga listor och översikter
- Prestanda-optimerade sökningar
- Initial filtrering innan detaljhämtning

RETURNERAR:
- Kompakt representation av utbildningstillfällen
- Mindre datamängd = snabbare respons
- Grundläggande information
- Paginerad lista

FILTER: (subset av full version)
- schoolUnitCode: Specifik skola
- typeOfSchool: Skoltyp
- municipality/county: Plats
- distance: Distansutbildning
- paceOfStudy: Studietakt
- searchTerm: Fritextsökning

EXEMPEL:
- municipality: "Göteborg", typeOfSchool: "Gymnasium"
- distance: true, searchTerm: "programmering"

RELATERADE VERKTYG:
- search_education_events_v4: Full detaljnivå
- count_education_events_v4: Räkna resultat

TIPS: Använd compact först för översikt, sedan full version för detaljer.`,
        inputSchema: { type: 'object', properties: searchCompactEducationEventsV4Schema },
      },
      {
        name: 'count_education_events_v4',
        description: `Räkna antal utbildningstillfällen som matchar dina filter.

ANVÄNDNINGSFALL:
- Se hur många träffar innan sökning
- Verifiera att filter ger resultat
- Statistik över utbildningsutbud
- Planera paginering
- Kvantitativ analys av utbudet

RETURNERAR:
- Totalt antal matchande tillfällen
- Återspeglar aktuella filter
- Snabb respons (ingen data hämtas)

FILTER:
- schoolUnitCode: Specifik skola
- typeOfSchool: Skoltyp
- municipality/county: Plats
- distance: Distansutbildning
- paceOfStudy: Studietakt
- programCode: Program
- searchTerm: Fritextsökning

EXEMPEL:
- programCode: "NA", municipality: "Stockholm"
- distance: true

RELATERADE VERKTYG:
- search_education_events_v4: Hämta faktiska resultat
- search_compact_education_events_v4: Snabb sökning

TIPS: Använd count först för att verifiera att dina filter ger resultat.`,
        inputSchema: { type: 'object', properties: countEducationEventsV4Schema },
      },
      {
        name: 'count_adult_education_events_v4',
        description: `Räkna antal vuxenutbildningstillfällen som matchar filter.

ANVÄNDNINGSFALL:
- Verifiera vuxenutbildningsutbud
- Statistik över YH/SFI/Komvux utbud
- Planera vuxenutbildningssökningar
- Kvantifiera tillgänglighet

RETURNERAR:
- Antal matchande vuxenutbildningstillfällen
- Snabb respons

FILTER:
- town: Ort
- executionCondition: Genomförandevillkor
- geographicalAreaCode: Geografisk områdeskod
- typeOfSchool: "yh", "sfi", "komvux"
- paceOfStudy: Studietakt
- county/municipality: Plats
- distance: Distansutbildning
- searchTerm: Fritextsökning

EXEMPEL:
- typeOfSchool: "yh", municipality: "Stockholm"
- distance: "true", paceOfStudy: "100"

RELATERADE VERKTYG:
- search_adult_education: Hämta faktiska vuxenutbildningar
- get_adult_type_of_schooling_v4: Se utbildningstyper`,
        inputSchema: { type: 'object', properties: countAdultEducationEventsV4Schema },
      },

      // ==============================================
      // V4 API VERKTYG - STATISTICS
      // ==============================================
      {
        name: 'get_national_statistics_fsk',
        description: `Hämta riksgenomsnittlig statistik för förskolor.

ANVÄNDNINGSFALL:
- Jämföra enskild förskola med rikssnitt
- Förstå nationella trender i förskolan
- Benchmarking av kvalitetsindikatorer
- Forskningsunderlag

RETURNERAR:
- Nationella genomsnittsvärden för förskolor
- Gruppstorlekar (rikssnitt)
- Personaltäthet
- Pedagogisk bemanning
- Läsårsspecifika värden

EXEMPEL:
- schoolYear: "2023/2024"
- indicator: "gruppstorlek" (om tillgängligt)

RELATERADE VERKTYG:
- get_school_unit_statistics_fsk: Jämför specifik förskola
- search_school_units_v4: Hitta förskolor att jämföra

TIPS: Använd detta som referensvärde när du analyserar enskilda förskolors statistik.`,
        inputSchema: { type: 'object', properties: getNationalStatisticsFSKSchema },
      },
      {
        name: 'get_national_statistics_gr',
        description: `Hämta riksgenomsnittlig statistik för grundskolor.

ANVÄNDNINGSFALL:
- Jämföra enskild grundskola med rikssnitt
- Förstå nationella betygstrender
- Benchmarking av skolresultat
- Kontextualisera skolstatistik
- Forskningsunderlag

RETURNERAR:
- Nationellt genomsnittligt meritvärde
- Riksgenomsnitt för behörighet till gymnasiet
- Nationella prov resultat (genomsnitt)
- Andel elever med godkända betyg
- Läsårsspecifika nationella värden

EXEMPEL:
- schoolYear: "2023/2024"
- indicator: "meritvärde" (om tillgängligt)

RELATERADE VERKTYG:
- get_school_unit_statistics_gr: Jämför specifik grundskola
- get_salsa_statistics_gr: Detaljerad ämnesstatistik (nationell)
- search_school_units_v4: Hitta grundskolor

VIKTIGT: Använd alltid rikssnitt som kontext när du bedömer enskilda skolors resultat!`,
        inputSchema: { type: 'object', properties: getNationalStatisticsGRSchema },
      },
      {
        name: 'get_national_statistics_gran',
        description: `Hämta riksgenomsnittlig statistik för grundsärskolor.

ANVÄNDNINGSFALL:
- Jämföra enskild grundsärskola med rikssnitt
- Förstå nationella trender i grundsärskolan
- Benchmarking av särskoleresultat
- Kontextualisera särskolestatistik

RETURNERAR:
- Nationella genomsnittsvärden för grundsärskolan
- Elevunderlag (rikssnitt)
- Utbildningsresultat
- Läsårsspecifika värden

EXEMPEL:
- schoolYear: "2023/2024"
- indicator: "elevantal" (om tillgängligt)

RELATERADE VERKTYG:
- get_school_unit_statistics_gran: Jämför specifik grundsärskola
- get_salsa_statistics_gran: Ämnesstatistik
- search_school_units_v4: Hitta grundsärskolor`,
        inputSchema: { type: 'object', properties: getNationalStatisticsGRANSchema },
      },
      {
        name: 'get_national_statistics_gy',
        description: `Hämta riksgenomsnittlig statistik för gymnasieskolor.

ANVÄNDNINGSFALL:
- Jämföra enskild gymnasieskola med rikssnitt
- Förstå nationella gymnasietrender
- Benchmarking av examensgrader
- Analysera högskolebehörighet i nationellt perspektiv
- Kontextualisera gymnasieresultat

RETURNERAR:
- Nationellt genomsnittligt meritvärde
- Riksgenomsnitt för examensgrad
- Behörighet till högskola (nationell nivå)
- Studieavbrott (rikssnitt)
- Läsårsspecifika nationella värden

EXEMPEL:
- schoolYear: "2023/2024"
- indicator: "examensgrad" (om tillgängligt)

RELATERADE VERKTYG:
- get_school_unit_statistics_gy: Jämför specifik gymnasieskola
- get_program_statistics_gy: Programspecifika rikssnitt
- search_school_units_v4: Hitta gymnasieskolor

VIKTIGT: Examensgrad och högskolebehörighet är centrala nyckeltal!`,
        inputSchema: { type: 'object', properties: getNationalStatisticsGYSchema },
      },
      {
        name: 'get_national_statistics_gyan',
        description: `Hämta riksgenomsnittlig statistik för gymnasiesärskolor.

ANVÄNDNINGSFALL:
- Jämföra enskild gymnasiesärskola med rikssnitt
- Förstå nationella trender i gymnasiesärskolan
- Benchmarking av särskoleresultat
- Kontextualisera gymnasiesärskolestatistik

RETURNERAR:
- Nationella genomsnittsvärden för gymnasiesärskolan
- Programgenomströmning (rikssnitt)
- Utbildningsresultat
- Läsårsspecifika värden

EXEMPEL:
- schoolYear: "2023/2024"
- indicator: "genomströmning" (om tillgängligt)

RELATERADE VERKTYG:
- get_school_unit_statistics_gyan: Jämför specifik gymnasiesärskola
- get_program_statistics_gyan: Programstatistik
- search_school_units_v4: Hitta gymnasiesärskolor`,
        inputSchema: { type: 'object', properties: getNationalStatisticsGYANSchema },
      },
      {
        name: 'get_salsa_statistics_gr',
        description: `Hämta SALSA-statistik (bedömningsstöd) för grundskolan nationellt.

ANVÄNDNINGSFALL:
- Analysera bedömningar i specifika ämnen
- Förstå nationella betygstrender per ämne
- Jämföra årskurser och ämnen
- Detaljerad ämnesdataanalys
- Pedagogisk utveckling och forskning

RETURNERAR:
- Betygsfördelning per ämne och årskurs
- Nationellt genomsnitt per ämne
- SALSA-indikatorer (bedömningsstöd)
- Läsårsspecifik ämnesstatistik

FILTER:
- subject: Ämne (t.ex. "Matematik", "Svenska")
- grade: Årskurs (t.ex. "3", "6", "9")
- schoolYear: Läsår (t.ex. "2023/2024")

EXEMPEL:
- subject: "Matematik", grade: "9", schoolYear: "2023/2024"
- subject: "Svenska", grade: "6"

RELATERADE VERKTYG:
- get_national_statistics_gr: Övergripande grundskolestatistik
- get_school_unit_statistics_gr: Jämför med enskild skola
- get_salsa_statistics_gran: SALSA för grundsärskolan

VIKTIGT: SALSA ger mycket detaljerad ämnesnivå som kompletterar övergripande statistik!`,
        inputSchema: { type: 'object', properties: getSALSAStatisticsGRSchema },
      },
      {
        name: 'get_salsa_statistics_gran',
        description: `Hämta SALSA-statistik (bedömningsstöd) för grundsärskolan nationellt.

ANVÄNDNINGSFALL:
- Analysera bedömningar i grundsärskolan
- Ämnesspecifik statistik för särskolan
- Följa utveckling i anpassad undervisning
- Pedagogiskt utvecklingsarbete

RETURNERAR:
- Bedömningsstatistik per ämne
- Nationella värden för grundsärskolan
- Läsårsspecifik ämnesdata

FILTER:
- subject: Ämne
- grade: Årskurs
- schoolYear: Läsår

EXEMPEL:
- subject: "Matematik", schoolYear: "2023/2024"
- grade: "9"

RELATERADE VERKTYG:
- get_national_statistics_gran: Övergripande grundsärskolestatistik
- get_salsa_statistics_gr: SALSA för grundskolan
- get_school_unit_statistics_gran: Enskild skola`,
        inputSchema: { type: 'object', properties: getSALSAStatisticsGRANSchema },
      },
      {
        name: 'get_program_statistics_gy',
        description: `Hämta programspecifik statistik för gymnasiet nationellt.

ANVÄNDNINGSFALL:
- Jämföra olika gymnasieprogram
- Analysera programspecifika resultat
- Förstå skillnader mellan programinriktningar
- Studie- och yrkesvägledning
- Benchmarking per program

RETURNERAR:
- Statistik per gymnasieprogram
- Examensgrad per program
- Högskolebehörighet per program
- Meritvärde per program och inriktning
- Läsårsspecifika programvärden

FILTER:
- programCode: Programkod (t.ex. "NA", "TE", "SA")
- orientation: Inriktning (om tillämpligt)
- schoolYear: Läsår

EXEMPEL:
- programCode: "NA", schoolYear: "2023/2024" (Naturvetenskapsprogrammet)
- programCode: "TE", orientation: "Informationsteknik"

RELATERADE VERKTYG:
- get_national_statistics_gy: Övergripande gymnasiestatistik
- get_school_unit_statistics_gy: Programresultat för enskild skola
- get_programs_v4: Se tillgängliga program och koder

TIPS: Använd för att jämföra Naturvetenskapsprogrammet med Teknikprogrammet, etc.`,
        inputSchema: { type: 'object', properties: getProgramStatisticsGYSchema },
      },
      {
        name: 'get_program_statistics_gyan',
        description: `Hämta programspecifik statistik för gymnasiesärskolan nationellt.

ANVÄNDNINGSFALL:
- Analysera program i gymnasiesärskolan
- Jämföra programresultat
- Programspecifik uppföljning
- Resursplanering per program

RETURNERAR:
- Statistik per gymnasiesärskoleprogram
- Genomströmning per program
- Utbildningsresultat per program
- Läsårsspecifika värden

FILTER:
- programCode: Programkod
- orientation: Inriktning
- schoolYear: Läsår

EXEMPEL:
- programCode: "GYSÄR", schoolYear: "2023/2024"
- programCode: "specifik kod"

RELATERADE VERKTYG:
- get_national_statistics_gyan: Övergripande gymnasiesärskolestatistik
- get_school_unit_statistics_gyan: Enskild skola
- get_program_statistics_gy: Jämför med reguljärt gymnasium`,
        inputSchema: { type: 'object', properties: getProgramStatisticsGYANSchema },
      },

      // ==============================================
      // V4 API VERKTYG - SUPPORT DATA
      // ==============================================
      {
        name: 'get_school_types_v4',
        description: `Hämta alla tillgängliga skoltyper (referensdata).

ANVÄNDNINGSFALL:
- Se vilka skoltyper som finns i systemet
- Förstå Skolverkets kategorisering
- Validera skoltypsparametrar innan sökning
- Bygga dropdown-listor
- Utforska skolsystemets struktur

RETURNERAR:
- Komplett lista över skoltyper
- Kod och namn för varje skoltyp
- Inklusive alla skolformer

EXEMPEL:
- Inga parametrar behövs

VÄRDEN INKLUDERAR:
- FSK (Förskola)
- GR (Grundskola)
- GRAN (Grundsärskola)
- GY (Gymnasium)
- GYAN (Gymnasiesärskola)
- KOMVUX (Kommunal vuxenutbildning)
- YH (Yrkeshögskola)
- och fler...

RELATERADE VERKTYG:
- search_school_units_v4: Använd skoltyp för filtrering
- get_school_unit_details_v4: Se vilka skoltyper en enhet har

TIPS: Hämta detta först för att se alla möjliga värden för schoolType-filter.`,
        inputSchema: { type: 'object', properties: getSchoolTypesV4Schema },
      },
      {
        name: 'get_geographical_areas_v4',
        description: `Hämta alla geografiska områden (län och kommuner).

ANVÄNDNINGSFALL:
- Se alla tillgängliga län och kommuner
- Validera geografiska filter
- Bygga ortsväljare
- Utforska Sveriges geografi i skolsammanhang
- Hitta korrekta kommun/länskoder

RETURNERAR:
- Lista över alla län
- Lista över alla kommuner
- Namn och koder för varje område
- Hierarkisk struktur (län innehåller kommuner)

EXEMPEL:
- Inga parametrar behövs

RETURNERAR VÄRDEN SOM:
- Stockholms län (kod: 01)
  - Stockholms kommun (kod: 0180)
  - Södertälje kommun (kod: 0181)
  - etc.
- Västra Götalands län (kod: 14)
  - Göteborg kommun (kod: 1480)
  - etc.

RELATERADE VERKTYG:
- search_school_units_v4: Filtrera efter kommun/län
- search_education_events_v4: Geografiska filter

TIPS: Använd detta för att hitta korrekta koder för county och municipality parametrar.`,
        inputSchema: { type: 'object', properties: getGeographicalAreasV4Schema },
      },
      {
        name: 'get_principal_organizer_types_v4',
        description: `Hämta alla huvudmanstyper (skolägarkategorier).

ANVÄNDNINGSFALL:
- Se vilka typer av skolhuvudmän som finns
- Förstå skillnaden mellan kommunal och enskild drift
- Filtrera efter ägartyp
- Analysera skolsystemets struktur

RETURNERAR:
- Lista över alla huvudmanstyper
- Kod och namn för varje typ

EXEMPEL:
- Inga parametrar behövs

VÄRDEN INKLUDERAR:
- Kommunal (kommunala skolor)
- Enskild (fristående/privata skolor)
- Landsting/Region
- Statlig
- och fler...

RELATERADE VERKTYG:
- search_school_units_v4: Filtrera efter principalOrganizerType
- get_school_unit_details_v4: Se skolans huvudman

TIPS: Använd för att jämföra kommunala mot fristående skolor.`,
        inputSchema: { type: 'object', properties: getPrincipalOrganizerTypesV4Schema },
      },
      {
        name: 'get_programs_v4',
        description: `Hämta alla gymnasieprogram med inriktningar.

ANVÄNDNINGSFALL:
- Se alla tillgängliga gymnasieprogram
- Hitta programkoder för filtrering
- Utforska programstruktur och inriktningar
- Studie- och yrkesvägledning
- Bygga programväljare

RETURNERAR:
- Komplett lista över alla gymnasieprogram
- Programkod och namn
- Inriktningar per program
- Yrkesutgång och studieinriktning

EXEMPEL:
- Inga parametrar behövs

VÄRDEN INKLUDERAR:
- NA (Naturvetenskapsprogrammet)
- TE (Teknikprogrammet)
- SA (Samhällsvetenskapsprogrammet)
- EK (Ekonomiprogrammet)
- och alla 18 nationella program + lokala program

RELATERADE VERKTYG:
- get_orientations_v4: Se alla inriktningar separat
- search_education_events_v4: Filtrera på programCode
- get_program_statistics_gy: Statistik per program

VIKTIGT: Detta är en nyckelresurs för att förstå gymnasieutbudet!`,
        inputSchema: { type: 'object', properties: getProgramsV4Schema },
      },
      {
        name: 'get_orientations_v4',
        description: `Hämta alla programinriktningar.

ANVÄNDNINGSFALL:
- Se alla specialiseringar inom program
- Hitta inriktningskoder
- Förstå programdifferentiering
- Detaljerad programfiltrering

RETURNERAR:
- Lista över alla inriktningar
- Inriktningskod och namn
- Koppling till program

EXEMPEL:
- Inga parametrar behövs

VÄRDEN INKLUDERAR:
- Teknikprogrammet: Design och produktutveckling, Informations- och medieteknik, Samhällsbyggande och miljö
- Naturvetenskapsprogrammet: Naturvetenskap, Naturvetenskap och samhälle
- och många fler...

RELATERADE VERKTYG:
- get_programs_v4: Se fullständig programstruktur
- search_education_events_v4: Filtrera på orientationCode
- get_program_statistics_gy: Statistik per inriktning`,
        inputSchema: { type: 'object', properties: getOrientationsV4Schema },
      },
      {
        name: 'get_instruction_languages_v4',
        description: `Hämta alla tillgängliga undervisningsspråk.

ANVÄNDNINGSFALL:
- Se vilka språk utbildningar erbjuds på
- Hitta engelskspråkiga program
- Filtrera efter undervisningsspråk
- Internationell skolanalys

RETURNERAR:
- Lista över alla undervisningsspråk
- Språkkod och namn

EXEMPEL:
- Inga parametrar behövs

VÄRDEN INKLUDERAR:
- Svenska
- Engelska
- Finska
- Samiska
- Teckenspråk
- och fler...

RELATERADE VERKTYG:
- search_education_events_v4: Filtrera på instructionLanguages
- get_school_unit_education_events: Se språk per skola

TIPS: Använd för att hitta internationella program eller språkimmersion.`,
        inputSchema: { type: 'object', properties: getInstructionLanguagesV4Schema },
      },
      {
        name: 'get_distance_study_types_v4',
        description: `Hämta alla typer av distansstudier.

ANVÄNDNINGSFALL:
- Förstå olika distansalternativ
- Klassificera distansutbildningar
- Filtrera efter distanstyp
- Analysera flexibla studiealternativ

RETURNERAR:
- Lista över distansstudietyper
- Kod och beskrivning

EXEMPEL:
- Inga parametrar behövs

VÄRDEN INKLUDERAR:
- Heldistans (100% distans)
- Delvis distans (blandad form)
- Flexibel studieform
- och fler...

RELATERADE VERKTYG:
- search_education_events_v4: Filtrera på distance
- filter_adult_education_by_distance: Distansvuxenutbildningar

TIPS: Kombinera med distance-filter för mer specifik filtrering.`,
        inputSchema: { type: 'object', properties: getDistanceStudyTypesV4Schema },
      },
      {
        name: 'get_adult_type_of_schooling_v4',
        description: `Hämta alla typer av vuxenutbildning.

ANVÄNDNINGSFALL:
- Se tillgängliga vuxenutbildningsformer
- Förstå vuxenutbildningssystemet
- Klassificera vuxenutbildningar
- Filtrera efter utbildningstyp

RETURNERAR:
- Lista över vuxenutbildningstyper
- Kod och namn

EXEMPEL:
- Inga parametrar behövs

VÄRDEN INKLUDERAR:
- YH (Yrkeshögskola)
- SFI (Svenska för invandrare)
- KOMVUX (Kommunal vuxenutbildning)
- SÄRVUX (Särskild vuxenutbildning)
- Folkhögskola
- och fler...

RELATERADE VERKTYG:
- search_adult_education: Filtrera på typeOfSchool
- count_adult_education_events_v4: Räkna per typ

TIPS: Använd för att förstå skillnaden mellan YH, SFI och Komvux.`,
        inputSchema: { type: 'object', properties: getAdultTypeOfSchoolingV4Schema },
      },
      {
        name: 'get_municipality_school_units_v4',
        description: `Hämta mappning mellan kommuner och deras skolenheter.

ANVÄNDNINGSFALL:
- Se alla skolor per kommun
- Analysera kommuns skolstruktur
- Kvantifiera skolenheter geografiskt
- Bygga kommunöversikter

RETURNERAR:
- Kommun-skolenhet-mappningar
- Antal skolenheter per kommun
- Fullständig geografisk struktur

EXEMPEL:
- Inga parametrar behövs

RETURNERAR:
- Stockholm kommun: [lista med skolenhetskoder]
- Göteborg kommun: [lista med skolenhetskoder]
- etc. för alla Sveriges kommuner

RELATERADE VERKTYG:
- search_school_units_v4: Sök skolor i specifik kommun
- get_geographical_areas_v4: Se alla kommuner
- get_school_unit_details_v4: Hämta detaljer om funna enheter

TIPS: Använd för att få en komplett bild av en kommuns skollandskap.`,
        inputSchema: { type: 'object', properties: getMunicipalitySchoolUnitsV4Schema },
      },

      // ==============================================
      // DIAGNOSTIK OCH HEALTH CHECK
      // ==============================================
      {
        name: 'health_check',
        description: `Kör en health check för att testa API-anslutningar och systemstatus.

ANVÄNDNINGSFALL:
- Diagnosticera anslutningsproblem
- Verifiera att alla API:er är tillgängliga
- Mäta response-tider
- Få rekommendationer för förbättringar

RETURNERAR:
- Overall status (healthy/degraded/unhealthy)
- Status för varje API (Syllabus, School Units, Planned Education)
- Latency för varje API
- Konfigurationsinformation
- Rekommendationer vid problem

EXEMPEL: Kör health_check(includeApiTests=true) för att testa alla API:er.`,
        inputSchema: {
          type: 'object',
          properties: healthCheckSchema,
        },
      },
    ],
  };
});

// ==============================================
// TOOL EXECUTION - Med progress reporting
// ==============================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  log.info('Tool called', { name, args });

  try {
    switch (name) {
      // Läroplan API (Syllabus)
      case 'search_subjects':
        return await searchSubjects(args as any);
      case 'get_subject_details':
        return await getSubjectDetails(args as any);
      case 'get_subject_versions':
        return await getSubjectVersions(args as any);
      case 'search_courses':
        return await searchCourses(args as any);
      case 'get_course_details':
        return await getCourseDetails(args as any);
      case 'get_course_versions':
        return await getCourseVersions(args as any);
      case 'search_programs':
        return await searchPrograms(args as any);
      case 'get_program_details':
        return await getProgramDetails(args as any);
      case 'get_program_versions':
        return await getProgramVersions(args as any);
      case 'search_curriculums':
        return await searchCurriculums(args as any);
      case 'get_curriculum_details':
        return await getCurriculumDetails(args as any);
      case 'get_curriculum_versions':
        return await getCurriculumVersions(args as any);
      case 'get_school_types':
        return await getSchoolTypes(args as any);
      case 'get_types_of_syllabus':
        return await getTypesOfSyllabus();
      case 'get_subject_and_course_codes':
        return await getSubjectAndCourseCodes();
      case 'get_study_path_codes':
        return await getStudyPathCodes(args as any);
      case 'get_api_info':
        return await getApiInfo();

      // Skolenhetsregistret API
      case 'search_school_units':
        return await searchSchoolUnits(args as any);
      case 'get_school_unit_details':
        return await getSchoolUnitDetails(args as any);
      case 'get_school_units_by_status':
        return await getSchoolUnitsByStatus(args as any);
      case 'search_school_units_by_name':
        return await searchSchoolUnitsByName(args as any);

      // Planned Educations API
      case 'search_adult_education':
        return await searchAdultEducation(args as any);
      case 'get_adult_education_details':
        return await getAdultEducationDetails(args as any);
      case 'filter_adult_education_by_distance':
        return await filterAdultEducationByDistance(args as any);
      case 'filter_adult_education_by_pace':
        return await filterAdultEducationByPace(args as any);
      case 'get_education_areas':
        return await getEducationAreas();
      case 'get_directions':
        return await getDirections();

      // V4 School Units
      case 'search_school_units_v4':
        return await searchSchoolUnitsV4(args as any);
      case 'get_school_unit_details_v4':
        return await getSchoolUnitDetailsV4(args as any);
      case 'get_school_unit_education_events':
        return await getSchoolUnitEducationEvents(args as any);
      case 'get_school_unit_compact_education_events':
        return await getSchoolUnitCompactEducationEvents(args as any);
      case 'calculate_distance_from_school_unit':
        return await calculateDistanceFromSchoolUnit(args as any);
      case 'get_school_unit_documents':
        return await getSchoolUnitDocuments(args as any);
      case 'get_school_unit_statistics_links':
        return await getSchoolUnitStatisticsLinks(args as any);
      case 'get_school_unit_statistics_fsk':
        return await getSchoolUnitStatisticsFSK(args as any);
      case 'get_school_unit_statistics_gr':
        return await getSchoolUnitStatisticsGR(args as any);
      case 'get_school_unit_statistics_gran':
        return await getSchoolUnitStatisticsGRAN(args as any);
      case 'get_school_unit_statistics_gy':
        return await getSchoolUnitStatisticsGY(args as any);
      case 'get_school_unit_statistics_gyan':
        return await getSchoolUnitStatisticsGYAN(args as any);
      case 'get_school_unit_survey_nested':
        return await getSchoolUnitSurveyNested(args as any);
      case 'get_school_unit_survey_flat':
        return await getSchoolUnitSurveyFlat(args as any);

      // V4 Education Events
      case 'search_education_events_v4':
        return await searchEducationEventsV4(args as any);
      case 'search_compact_education_events_v4':
        return await searchCompactEducationEventsV4(args as any);
      case 'count_education_events_v4':
        return await countEducationEventsV4(args as any);
      case 'count_adult_education_events_v4':
        return await countAdultEducationEventsV4(args as any);

      // V4 Statistics
      case 'get_national_statistics_fsk':
        return await getNationalStatisticsFSK(args as any);
      case 'get_national_statistics_gr':
        return await getNationalStatisticsGR(args as any);
      case 'get_national_statistics_gran':
        return await getNationalStatisticsGRAN(args as any);
      case 'get_national_statistics_gy':
        return await getNationalStatisticsGY(args as any);
      case 'get_national_statistics_gyan':
        return await getNationalStatisticsGYAN(args as any);
      case 'get_salsa_statistics_gr':
        return await getSALSAStatisticsGR(args as any);
      case 'get_salsa_statistics_gran':
        return await getSALSAStatisticsGRAN(args as any);
      case 'get_program_statistics_gy':
        return await getProgramStatisticsGY(args as any);
      case 'get_program_statistics_gyan':
        return await getProgramStatisticsGYAN(args as any);

      // V4 Support Data
      case 'get_school_types_v4':
        return await getSchoolTypesV4();
      case 'get_geographical_areas_v4':
        return await getGeographicalAreasV4();
      case 'get_principal_organizer_types_v4':
        return await getPrincipalOrganizerTypesV4();
      case 'get_programs_v4':
        return await getProgramsV4();
      case 'get_orientations_v4':
        return await getOrientationsV4();
      case 'get_instruction_languages_v4':
        return await getInstructionLanguagesV4();
      case 'get_distance_study_types_v4':
        return await getDistanceStudyTypesV4();
      case 'get_adult_type_of_schooling_v4':
        return await getAdultTypeOfSchoolingV4();
      case 'get_municipality_school_units_v4':
        return await getMunicipalitySchoolUnitsV4();

      // Diagnostik
      case 'health_check':
        return await healthCheck(args || {});

      default:
        throw new Error(`Okänt verktyg: ${name}`);
    }
  } catch (error) {
    log.error('Tool execution failed', { name, error });

    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid körning av verktyg ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// ==============================================
// START SERVER
// ==============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  log.info('Skolverket MCP Server v2.4.0 startad', {
    capabilities: ['tools', 'resources', 'prompts', 'logging'],
    apis: ['Läroplan API', 'Skolenhetsregistret API', 'Planned Educations API']
  });
}

main().catch((error) => {
  log.error('Fatal error', { error });
  process.exit(1);
});
