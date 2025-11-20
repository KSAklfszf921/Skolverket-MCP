#!/usr/bin/env node

/**
 * Skolverket MCP Server v2.1.3
 *
 * Komplett MCP server för att ge LLMs tillgång till Skolverkets öppna API:er:
 * - Läroplan API (läroplaner, ämnen, kurser, program)
 * - Skolenhetsregistret API (skolenheter och deras status)
 * - Planned Educations API (utbildningstillfällen, statistik, inspektionsrapporter)
 *
 * Version 2.1.3 förbättringar:
 * - Resources för kontextläsning
 * - Prompts för vanliga användningsfall
 * - Progress reporting
 * - Strukturerad logging
 * - Caching
 * - Rate limiting
 * - Input validation
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

// Import logger, errors och constants
import { log } from './logger.js';
import { ResourceNotFoundError } from './errors.js';
import { SERVER_NAME, SERVER_VERSION, ToolName, PromptName, ResourceUri } from './constants.js';

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

// Health check verktyg
import {
  healthCheck,
  healthCheckSchema
} from './tools/health.js';

// Skapa servern med uppdaterade capabilities
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
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
        uri: ResourceUri.API_INFO,
        name: 'Skolverket API Information',
        mimeType: 'application/json',
        description: 'Information om Skolverkets Läroplan API'
      },
      {
        uri: ResourceUri.SCHOOL_TYPES,
        name: 'Alla skoltyper',
        mimeType: 'application/json',
        description: 'Lista över alla aktiva skoltyper (GR, GY, VUX, etc.)'
      },
      {
        uri: ResourceUri.TYPES_OF_SYLLABUS,
        name: 'Typer av läroplaner',
        mimeType: 'application/json',
        description: 'Lista över alla typer av läroplaner'
      },
      {
        uri: ResourceUri.EDUCATION_AREAS,
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
      case ResourceUri.API_INFO: {
        const info = await syllabusApi.getApiInfo();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(info, null, 2)
          }]
        };
      }

      case ResourceUri.SCHOOL_TYPES: {
        const types = await syllabusApi.getSchoolTypes();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(types, null, 2)
          }]
        };
      }

      case ResourceUri.TYPES_OF_SYLLABUS: {
        const types = await syllabusApi.getTypesOfSyllabus();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(types, null, 2)
          }]
        };
      }

      case ResourceUri.EDUCATION_AREAS: {
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

/**
 * Graceful shutdown handler
 */
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) {
    log.warn('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;
  log.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Ge pågående requests lite tid att slutföra
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stoppa cache auto-prune
    const { cache } = await import('./cache.js');
    cache.stopAutoPrune();

    // Logga cache stats innan stängning
    log.info('Final cache statistics', cache.getStats());

    log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', { error });
    process.exit(1);
  }
}

// Registrera shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Hantera uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', { error });
  shutdown('uncaughtException');
});

// Hantera unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection', { reason, promise });
  shutdown('unhandledRejection');
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  log.info(`${SERVER_NAME} v${SERVER_VERSION} started`, {
    capabilities: ['tools', 'resources', 'prompts', 'logging'],
    apis: ['Läroplan API', 'Skolenhetsregistret API', 'Planned Educations API']
  });
}

main().catch((error) => {
  log.error('Fatal error', { error });
  process.exit(1);
});
