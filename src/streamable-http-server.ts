#!/usr/bin/env node

/**
 * Skolverket MCP Server v2.1.0 - HTTP/SSE Transport
 *
 * HTTP server implementation using StreamableHTTPServerTransport
 * for compatibility with OpenAI ChatGPT and other HTTP-based MCP clients.
 */

import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
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
} from './tools/syllabus/subjects.js';

import {
  searchCourses,
  getCourseDetails,
  getCourseVersions,
} from './tools/syllabus/courses.js';

import {
  searchPrograms,
  getProgramDetails,
  getProgramVersions,
} from './tools/syllabus/programs.js';

import {
  searchCurriculums,
  getCurriculumDetails,
  getCurriculumVersions,
} from './tools/syllabus/curriculums.js';

import {
  getSchoolTypes,
  getTypesOfSyllabus,
  getSubjectAndCourseCodes,
  getStudyPathCodes,
  getApiInfo,
} from './tools/syllabus/valuestore.js';

// Importera skolenhetsverktyg (School Units API)
import {
  searchSchoolUnits,
  getSchoolUnitDetails,
  getSchoolUnitsByStatus,
  searchSchoolUnitsByName,
} from './tools/school-units/search.js';

// Importera planned education verktyg
import {
  searchAdultEducation,
  getAdultEducationDetails,
  filterAdultEducationByDistance,
  filterAdultEducationByPace,
} from './tools/planned-education/adult-education.js';

import {
  getEducationAreas,
  getDirections,
} from './tools/planned-education/support-data.js';

// Health check verktyg
import {
  healthCheck,
} from './tools/health.js';

// Skapa servern med uppdaterade capabilities
const mcpServer = new Server(
  {
    name: 'skolverket-mcp',
    version: '2.1.0',
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

mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
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

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
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

mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
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
      }
    ]
  };
});

mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  log.info('Prompt requested', { name, args });

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

    default:
      throw new Error(`Okänd prompt: ${name}`);
  }
});

// ==============================================
// TOOLS - Med förbättrade beskrivningar
// ==============================================

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  log.info('Tools list requested');

  return {
    tools: [
      // Ämnesverktyg
      {
        name: 'search_subjects',
        description: 'Sök efter ämnen i Skolverkets läroplan. Returnerar lista över ämnen med kod, namn, beskrivning och version.',
        inputSchema: {
          type: 'object',
          properties: {
            schooltype: { type: 'string', description: 'Skoltyp (t.ex. GR, GY, VUX)' },
            timespan: { type: 'string', description: 'Tidsperiod: LATEST (gällande), FUTURE (framtida), EXPIRED (utgångna), MODIFIED (ändrade)' }
          }
        }
      },
      {
        name: 'get_subject_details',
        description: 'Hämta detaljerad information om ett specifikt ämne.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Ämneskod' }
          },
          required: ['code']
        }
      },
      {
        name: 'get_subject_versions',
        description: 'Hämta alla tillgängliga versioner av ett ämne.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Ämneskod' }
          },
          required: ['code']
        }
      },

      // Kursverktyg
      {
        name: 'search_courses',
        description: 'Sök efter kurser i Skolverkets läroplan.',
        inputSchema: {
          type: 'object',
          properties: {
            schooltype: { type: 'string', description: 'Skoltyp' },
            subjectCode: { type: 'string', description: 'Ämneskod för filtrering' },
            timespan: { type: 'string', description: 'Tidsperiod: LATEST, FUTURE, EXPIRED, MODIFIED' }
          }
        }
      },
      {
        name: 'get_course_details',
        description: 'Hämta detaljerad information om en specifik kurs inkl. centralt innehåll och kunskapskrav.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Kurskod (t.ex. MATMAT01c)' }
          },
          required: ['code']
        }
      },
      {
        name: 'get_course_versions',
        description: 'Hämta alla versioner av en kurs.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Kurskod' }
          },
          required: ['code']
        }
      },

      // Programverktyg
      {
        name: 'search_programs',
        description: 'Sök efter gymnasieprogram och studievägar.',
        inputSchema: {
          type: 'object',
          properties: {
            schooltype: { type: 'string', description: 'Skoltyp (normalt GY för gymnasium)' },
            timespan: { type: 'string', description: 'Tidsperiod: LATEST, FUTURE, EXPIRED, MODIFIED' }
          }
        }
      },
      {
        name: 'get_program_details',
        description: 'Hämta detaljerad information om ett specifikt program inkl. inriktningar.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Programkod (t.ex. NA, TE)' }
          },
          required: ['code']
        }
      },
      {
        name: 'get_program_versions',
        description: 'Hämta versionshistorik för ett program.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Programkod' }
          },
          required: ['code']
        }
      },

      // Läroplansverktyg
      {
        name: 'search_curriculums',
        description: 'Sök efter läroplaner (t.ex. LGR11, GY11).',
        inputSchema: {
          type: 'object',
          properties: {
            timespan: { type: 'string', description: 'Tidsperiod: LATEST, FUTURE, EXPIRED, MODIFIED' }
          }
        }
      },
      {
        name: 'get_curriculum_details',
        description: 'Hämta komplett läroplan med alla avsnitt.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Läroplanskod (t.ex. LGR11)' }
          },
          required: ['code']
        }
      },
      {
        name: 'get_curriculum_versions',
        description: 'Hämta versionshistorik för en läroplan.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Läroplanskod' }
          },
          required: ['code']
        }
      },

      // Värdesamlingsverktyg
      {
        name: 'get_school_types',
        description: 'Hämta lista över alla skoltyper (GR, GY, VUX, etc.).',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_types_of_syllabus',
        description: 'Hämta alla typer av läroplaner.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_subject_and_course_codes',
        description: 'Hämta alla tillgängliga ämnes- och kurskoder.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_study_path_codes',
        description: 'Hämta studievägskodar (programkoder).',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Typ av studieväg' }
          }
        }
      },
      {
        name: 'get_api_info',
        description: 'Hämta information om Skolverkets Läroplan API.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // Skolenhetsverktyg
      {
        name: 'search_school_units',
        description: 'Sök efter skolenheter med filter.',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Status (AKTIV, UPPHORT, VILANDE)' }
          }
        }
      },
      {
        name: 'get_school_unit_details',
        description: 'Hämta detaljer om en specifik skolenhet.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Skolenhetskod (8 siffror)' }
          },
          required: ['code']
        }
      },
      {
        name: 'get_school_units_by_status',
        description: 'Filtrera skolenheter efter status.',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Status (AKTIV, UPPHORT, VILANDE)' }
          },
          required: ['status']
        }
      },
      {
        name: 'search_school_units_by_name',
        description: 'Sök skolenheter efter namn.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Skolnamn eller del av namn' }
          },
          required: ['name']
        }
      },

      // Vuxenutbildningsverktyg
      {
        name: 'search_adult_education',
        description: 'Sök vuxenutbildningar (YH, SFI, Komvux) med omfattande filter.',
        inputSchema: {
          type: 'object',
          properties: {
            searchTerm: { type: 'string', description: 'Sökord' },
            town: { type: 'string', description: 'Stad' },
            typeOfSchool: { type: 'string', description: 'Typ: yh, sfi, komvuxgycourses' },
            distance: { type: 'string', description: 'true eller false för distans' },
            paceOfStudy: { type: 'string', description: 'Studietakt: 100, 50, etc.' }
          }
        }
      },
      {
        name: 'get_adult_education_details',
        description: 'Hämta detaljerad information om ett utbildningstillfälle.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Utbildnings-ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'filter_adult_education_by_distance',
        description: 'Filtrera utbildningar på distans eller campus.',
        inputSchema: {
          type: 'object',
          properties: {
            distance: { type: 'boolean', description: 'true för endast distans' }
          },
          required: ['distance']
        }
      },
      {
        name: 'filter_adult_education_by_pace',
        description: 'Filtrera utbildningar efter studietakt.',
        inputSchema: {
          type: 'object',
          properties: {
            paceOfStudy: { type: 'string', description: 'Studietakt: 100, 50, 25, etc.' }
          },
          required: ['paceOfStudy']
        }
      },

      // Stöddata
      {
        name: 'get_education_areas',
        description: 'Hämta alla utbildningsområden för vuxenutbildning.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_directions',
        description: 'Hämta alla inriktningar för utbildningar.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // Health check
      {
        name: 'health_check',
        description: 'Kör en health check för att testa API-anslutningar och systemstatus.',
        inputSchema: {
          type: 'object',
          properties: {
            includeApiTests: { type: 'boolean', description: 'Inkludera API-tester' }
          }
        }
      }
    ]
  };
});

// ==============================================
// TOOL EXECUTION - Med progress reporting
// ==============================================

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
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
// HTTP SERVER SETUP
// ==============================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for OG images)
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'skolverket-mcp',
    version: '2.1.0',
    transport: 'streamable-http'
  });
});

// MCP Playground endpoint - Interactive tool testing
app.get('/playground', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Playground - Skolverket MCP Server</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fafafa;
      color: #1d1d1f;
      line-height: 1.6;
    }
    .header {
      background: #832561;
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 24px;
    }
    .playground {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .panel {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .panel h2 {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 20px;
      color: #832561;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #1d1d1f;
    }
    select, input, textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    select:focus, input:focus, textarea:focus {
      outline: none;
      border-color: #832561;
    }
    textarea {
      min-height: 120px;
      font-family: 'SF Mono', Monaco, monospace;
      resize: vertical;
    }
    button {
      background: #832561;
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      width: 100%;
    }
    button:hover:not(:disabled) {
      background: #6b1e4f;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .result {
      background: #f5f5f7;
      border-radius: 8px;
      padding: 16px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 13px;
      max-height: 500px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .result.error {
      background: #fff5f5;
      color: #c41e3a;
    }
    .result.success {
      background: #f0fdf4;
      color: #166534;
    }
    .loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .examples {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .example-btn {
      padding: 8px 14px;
      background: #f5f5f7;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      width: auto;
    }
    .example-btn:hover {
      background: #832561;
      color: white;
      border-color: #832561;
    }
    .help-text {
      font-size: 13px;
      color: #86868b;
      margin-top: 6px;
    }
    @media (max-width: 768px) {
      .playground {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎮 MCP Playground</h1>
    <p>Testa alla 29 Skolverket MCP-verktyg interaktivt</p>
  </div>

  <div class="container">
    <div class="playground">
      <!-- Left panel: Input -->
      <div class="panel">
        <h2>Välj verktyg</h2>

        <div class="form-group">
          <label for="tool-select">MCP Tool</label>
          <select id="tool-select" onchange="updateToolParams()">
            <option value="">-- Välj ett verktyg --</option>
            <optgroup label="Läroplaner (17 verktyg)">
              <option value="search_subjects">Sök ämnen</option>
              <option value="get_subject_details">Hämta ämnesdetaljer</option>
              <option value="get_subject_versions">Hämta ämnesversioner</option>
              <option value="search_courses">Sök kurser</option>
              <option value="get_course_details">Hämta kursdetaljer</option>
              <option value="get_course_versions">Hämta kursversioner</option>
              <option value="search_programs">Sök gymnasieprogram</option>
              <option value="get_program_details">Hämta programdetaljer</option>
              <option value="get_program_versions">Hämta programversioner</option>
              <option value="search_curriculums">Sök läroplaner</option>
              <option value="get_curriculum_details">Hämta läroplansdetaljer</option>
              <option value="get_curriculum_versions">Hämta läroplansversioner</option>
              <option value="get_school_types">Hämta skoltyper</option>
              <option value="get_types_of_syllabus">Hämta läroplanstyper</option>
              <option value="get_subject_and_course_codes">Hämta ämnes- & kurskoder</option>
              <option value="get_study_path_codes">Hämta studievägskoder</option>
              <option value="get_api_info">Hämta API-info</option>
            </optgroup>
            <optgroup label="Skolenheter (4 verktyg)">
              <option value="search_school_units">Sök skolenheter</option>
              <option value="get_school_unit_details">Hämta skolenhetsdetaljer</option>
              <option value="get_school_units_by_status">Filtrera på status</option>
              <option value="search_school_units_by_name">Sök efter namn</option>
            </optgroup>
            <optgroup label="Vuxenutbildning (7 verktyg)">
              <option value="search_adult_education">Sök vuxenutbildningar</option>
              <option value="get_adult_education_details">Hämta utbildningsdetaljer</option>
              <option value="filter_adult_education_by_distance">Filtrera på distans</option>
              <option value="filter_adult_education_by_pace">Filtrera på studietakt</option>
              <option value="get_education_areas">Hämta utbildningsområden</option>
              <option value="get_directions">Hämta inriktningar</option>
            </optgroup>
            <optgroup label="Diagnostik (1 verktyg)">
              <option value="health_check">Health Check</option>
            </optgroup>
          </select>
        </div>

        <div id="params-container"></div>

        <button id="run-btn" onclick="runTool()" disabled>
          Kör verktyg
        </button>

        <div class="examples" id="examples-container"></div>
      </div>

      <!-- Right panel: Output -->
      <div class="panel">
        <h2>Resultat</h2>
        <div id="result" class="result">
Välj ett verktyg och klicka på "Kör verktyg" för att se resultat här.

Exempel:
1. Välj "Sök kurser" från dropdown
2. Skriv "Matematik" i sökfältet
3. Klicka "Kör verktyg"
        </div>
      </div>
    </div>
  </div>

  <script>
    const toolParams = {
      search_subjects: { schooltype: { label: 'Skoltyp', example: 'GY', optional: true } },
      get_subject_details: { code: { label: 'Ämneskod', example: 'MAT' } },
      get_subject_versions: { code: { label: 'Ämneskod', example: 'MAT' } },
      search_courses: { schooltype: { label: 'Skoltyp', example: 'GY', optional: true }, subjectCode: { label: 'Ämneskod', example: 'MAT', optional: true } },
      get_course_details: { code: { label: 'Kurskod', example: 'MATMAT01c' } },
      get_course_versions: { code: { label: 'Kurskod', example: 'MATMAT01c' } },
      search_programs: { schooltype: { label: 'Skoltyp', example: 'GY', optional: true } },
      get_program_details: { code: { label: 'Programkod', example: 'NA' } },
      get_program_versions: { code: { label: 'Programkod', example: 'NA' } },
      search_curriculums: {},
      get_curriculum_details: { code: { label: 'Läroplankod', example: 'LGR11' } },
      get_curriculum_versions: { code: { label: 'Läroplankod', example: 'LGR11' } },
      get_school_types: {},
      get_types_of_syllabus: {},
      get_subject_and_course_codes: {},
      get_study_path_codes: {},
      get_api_info: {},
      search_school_units: { status: { label: 'Status', example: 'AKTIV', optional: true } },
      get_school_unit_details: { code: { label: 'Skolenhetskod (8 siffror)', example: '12345678' } },
      get_school_units_by_status: { status: { label: 'Status', example: 'AKTIV' } },
      search_school_units_by_name: { name: { label: 'Skolnamn', example: 'Röda skolan' } },
      search_adult_education: { searchTerm: { label: 'Sökord', example: 'programmering', optional: true }, typeOfSchool: { label: 'Skoltyp', example: 'yh', optional: true } },
      get_adult_education_details: { id: { label: 'Utbildnings-ID', example: '12345' } },
      get_education_areas: {},
      get_directions: {},
      health_check: {}
    };

    const examples = {
      search_courses: [
        { label: 'Matematik-kurser', params: { schooltype: 'GY', subjectCode: 'MAT' } },
        { label: 'Alla GY-kurser', params: { schooltype: 'GY' } }
      ],
      get_course_details: [
        { label: 'Matematik 1c', params: { code: 'MATMAT01c' } },
        { label: 'Svenska 1', params: { code: 'SVASVA01' } }
      ],
      search_programs: [
        { label: 'Gymnasieprogram', params: { schooltype: 'GY' } }
      ],
      search_school_units: [
        { label: 'Aktiva skolor', params: { status: 'AKTIV' } }
      ],
      search_adult_education: [
        { label: 'YH inom IT', params: { searchTerm: 'programmering', typeOfSchool: 'yh' } }
      ]
    };

    function updateToolParams() {
      const toolSelect = document.getElementById('tool-select');
      const paramsContainer = document.getElementById('params-container');
      const examplesContainer = document.getElementById('examples-container');
      const runBtn = document.getElementById('run-btn');
      const selectedTool = toolSelect.value;

      if (!selectedTool) {
        paramsContainer.innerHTML = '';
        examplesContainer.innerHTML = '';
        runBtn.disabled = true;
        return;
      }

      runBtn.disabled = false;
      const params = toolParams[selectedTool] || {};

      let html = '';
      for (const [key, config] of Object.entries(params)) {
        const required = !config.optional;
        html += \`
          <div class="form-group">
            <label for="param-\${key}">\${config.label} \${required ? '*' : '(valfritt)'}</label>
            <input type="text" id="param-\${key}" placeholder="\${config.example}" \${required ? 'required' : ''}>
            <div class="help-text">Exempel: \${config.example}</div>
          </div>
        \`;
      }

      paramsContainer.innerHTML = html;

      // Show examples
      if (examples[selectedTool]) {
        examplesContainer.innerHTML = '<div class="help-text" style="margin-bottom: 8px;">Snabbexempel:</div>';
        examples[selectedTool].forEach(ex => {
          const btn = document.createElement('button');
          btn.className = 'example-btn';
          btn.textContent = ex.label;
          btn.onclick = () => loadExample(ex.params);
          examplesContainer.appendChild(btn);
        });
      } else {
        examplesContainer.innerHTML = '';
      }
    }

    function loadExample(params) {
      for (const [key, value] of Object.entries(params)) {
        const input = document.getElementById(\`param-\${key}\`);
        if (input) input.value = value;
      }
    }

    async function runTool() {
      const toolSelect = document.getElementById('tool-select');
      const resultDiv = document.getElementById('result');
      const runBtn = document.getElementById('run-btn');
      const selectedTool = toolSelect.value;

      if (!selectedTool) return;

      // Collect parameters
      const params = {};
      const paramInputs = document.querySelectorAll('[id^="param-"]');
      paramInputs.forEach(input => {
        const key = input.id.replace('param-', '');
        if (input.value) params[key] = input.value;
      });

      // Show loading
      runBtn.disabled = true;
      runBtn.innerHTML = '<span class="loading"></span>Kör...';
      resultDiv.className = 'result';
      resultDiv.textContent = 'Kör verktyg...';

      try {
        const response = await fetch('/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
              name: selectedTool,
              arguments: params
            }
          })
        });

        const data = await response.json();

        if (data.error) {
          resultDiv.className = 'result error';
          resultDiv.textContent = JSON.stringify(data.error, null, 2);
        } else {
          resultDiv.className = 'result success';
          resultDiv.textContent = JSON.stringify(data.result, null, 2);
        }
      } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = 'Error: ' + error.message;
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = 'Kör verktyg';
      }
    }
  </script>
</body>
</html>
  `);
});

// Root endpoint - Documentation
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Skolverket MCP Server - Model Context Protocol för svenska läroplaner</title>

  <!-- SEO Meta Tags -->
  <meta name="description" content="MCP server for Swedish National Agency for Education (Skolverket) open data. Tuned for LLMs to query, parse, and integrate info, data, and stats from three public API endpoints.">
  <meta name="keywords" content="skolverket, mcp, model context protocol, läroplan, curriculum, chatgpt, claude, ai, education, sweden, swedish">
  <meta name="author" content="Isak Skogstad">

  <!-- Open Graph / Social Media Meta Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://${req.get('host')}/">
  <meta property="og:title" content="Skolverket MCP server - Give AI Access to Swedish Education Data">
  <meta property="og:description" content="MCP server for Swedish National Agency for Education (Skolverket) open data. Tuned for LLMs to query, parse, and integrate info, data, and stats from three public API endpoints.">
  <meta property="og:image" content="https://${req.get('host')}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Skolverket MCP - AI access to Swedish education data via Model Context Protocol">
  <meta property="og:site_name" content="Skolverket MCP Server">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@isakskogstad">
  <meta name="twitter:title" content="Skolverket MCP server - Give AI Access to Swedish Education Data">
  <meta name="twitter:description" content="MCP server for Swedish National Agency for Education (Skolverket) open data. Tuned for LLMs to query, parse, and integrate info, data, and stats from three public API endpoints.">
  <meta name="twitter:image" content="https://${req.get('host')}/og-image-twitter.png">
  <meta name="twitter:image:alt" content="Skolverket MCP - AI access to Swedish education data">

  <!-- LinkedIn specific -->
  <meta property="og:image:secure_url" content="https://${req.get('host')}/og-image.png">

  <!-- Canonical URL -->
  <link rel="canonical" href="https://${req.get('host')}/">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" type="image/png" href="/og-image-square.png">

  <!-- Structured Data (Schema.org JSON-LD) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Skolverket MCP Server",
    "description": "MCP server for Swedish National Agency for Education (Skolverket) open data. Tuned for LLMs to query, parse, and integrate info, data, and stats from three public API endpoints.",
    "url": "https://${req.get('host')}/",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "Isak Skogstad",
      "email": "isak.skogstad@me.com",
      "sameAs": "https://x.com/isakskogstad"
    },
    "publisher": {
      "@type": "Person",
      "name": "Isak Skogstad"
    },
    "softwareVersion": "2.1.0",
    "datePublished": "2025-01-20",
    "inLanguage": ["sv", "en"],
    "keywords": "skolverket, mcp, model context protocol, läroplan, curriculum, chatgpt, claude, ai, education, sweden, swedish",
    "featureList": [
      "29 MCP tools for curriculum data",
      "4 MCP resources for context",
      "5 prompt templates",
      "Access to 3 Skolverket APIs",
      "Läroplan API integration",
      "Skolenhetsregistret API integration",
      "Planned Educations API integration"
    ]
  }
  </script>

  <style>
    /* === Base & Reset === */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #fafafa;
      color: #1d1d1f;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    /* === Header === */
    .header {
      background: #ffffff;
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 24px;
    }
    .nav-left { display: flex; align-items: center; }
    .nav-right {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    /* === Status Badges === */
    .status-badge {
      background: #f5f5f7;
      color: #86868b;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 400;
      cursor: help;
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .status-badge:hover {
      background: #ebebeb;
    }
    .status-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #86868b;
      transition: background 0.3s;
    }
    .status-badge.status-online::before {
      background: #34c759;
      box-shadow: 0 0 8px rgba(52, 199, 89, 0.4);
    }
    .status-badge.status-offline::before {
      background: #ff3b30;
      box-shadow: 0 0 8px rgba(255, 59, 48, 0.4);
    }
    .status-badge.status-checking::before {
      background: #ff9500;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* === Navigation Links & Buttons === */
    .nav-link {
      color: #1d1d1f;
      text-decoration: none;
      font-size: 14px;
      font-weight: 400;
      padding: 8px 12px;
      border-radius: 8px;
      transition: background 0.2s, color 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .nav-link:hover {
      background: #f5f5f7;
    }
    .icon-btn {
      background: transparent;
      border: none;
      color: #1d1d1f;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-btn:hover {
      background: #f5f5f7;
    }

    /* === Search Expanded === */
    .search-expanded {
      display: none;
      background: #ffffff;
      padding: 16px 0;
      border-top: 1px solid #f5f5f7;
    }
    .search-expanded.active {
      display: block;
    }
    .search-expanded .container {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .search-input-expanded {
      flex: 1;
      padding: 12px 16px;
      font-size: 15px;
      border: none;
      background: #f5f5f7;
      border-radius: 8px;
      outline: none;
      font-family: inherit;
    }
    .search-input-expanded:focus {
      background: #ebebeb;
    }
    .search-close {
      background: transparent;
      border: none;
      color: #86868b;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .search-close:hover {
      background: #f5f5f7;
    }

    /* === Container === */
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* === Progress Bar (subtle) === */
    .progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 1px;
      background: #007aff;
      width: 0;
      z-index: 101;
      opacity: 0.6;
    }

    /* === Documentation Navigation === */
    .doc-nav-sticky {
      position: sticky;
      top: 65px;
      background: #ffffff;
      padding: 16px 0;
      z-index: 90;
      margin-bottom: 40px;
    }
    .doc-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }
    .doc-btn {
      background: transparent;
      color: #86868b;
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 400;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
      white-space: nowrap;
      font-family: inherit;
    }
    .doc-btn:hover {
      background: #f5f5f7;
      color: #1d1d1f;
    }
    .doc-btn.active {
      background: #f5f5f7;
      color: #1d1d1f;
      font-weight: 500;
    }

    /* === TOC Modal === */
    .toc-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 200;
      backdrop-filter: blur(4px);
    }
    .toc-modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toc-modal-content {
      background: #ffffff;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .toc-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #f5f5f7;
    }
    .toc-modal-header h3 {
      font-size: 18px;
      font-weight: 500;
      color: #1d1d1f;
    }
    .toc-modal-close {
      background: transparent;
      border: none;
      color: #86868b;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .toc-modal-close:hover {
      background: #f5f5f7;
    }
    .toc-modal-body {
      padding: 24px;
      overflow-y: auto;
    }
    .toc-list {
      list-style: none;
    }
    .toc-list li {
      margin: 8px 0;
    }
    .toc-list a {
      color: #1d1d1f;
      text-decoration: none;
      font-size: 14px;
      padding: 8px 12px;
      display: block;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .toc-list a:hover {
      background: #f5f5f7;
    }

    /* === Main Content === */
    .doc-content {
      background: #ffffff;
      border-radius: 8px;
      padding: 40px;
      margin-bottom: 40px;
      min-height: 400px;
    }

    /* === Typography === */
    #github-content h1 {
      font-size: 32px;
      font-weight: 500;
      color: #1d1d1f;
      margin: 0 0 24px 0;
      letter-spacing: -0.5px;
    }
    #github-content h2 {
      font-size: 22px;
      font-weight: 500;
      color: #1d1d1f;
      margin: 40px 0 16px 0;
      letter-spacing: -0.3px;
    }
    #github-content h3 {
      font-size: 18px;
      font-weight: 500;
      color: #1d1d1f;
      margin: 24px 0 12px 0;
    }
    #github-content p {
      color: #86868b;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    #github-content a {
      color: #007aff;
      text-decoration: none;
    }
    #github-content a:hover {
      text-decoration: underline;
    }
    #github-content code {
      background: #f5f5f7;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 14px;
      font-family: 'SF Mono', Monaco, monospace;
    }
    #github-content pre {
      background: #f5f5f7;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;
      position: relative;
    }
    #github-content pre code {
      background: transparent;
      padding: 0;
    }
    #github-content pre .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      color: #1d1d1f;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s;
      font-family: inherit;
    }
    #github-content pre:hover .copy-btn {
      opacity: 1;
    }
    #github-content pre .copy-btn:hover {
      background: #f5f5f7;
      border-color: #007aff;
    }
    #github-content pre .copy-btn.copied {
      background: #34c759;
      border-color: #34c759;
      color: #ffffff;
    }
    #github-content ul,
    #github-content ol {
      margin-left: 24px;
      margin-bottom: 16px;
      color: #86868b;
    }
    #github-content li {
      margin: 8px 0;
      padding-left: 8px;
    }
    #github-content blockquote {
      border-left: 3px solid #f5f5f7;
      padding-left: 16px;
      margin: 16px 0;
      color: #86868b;
    }
    #github-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    #github-content th,
    #github-content td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #f5f5f7;
    }
    #github-content th {
      background: #fafafa;
      font-weight: 500;
      color: #1d1d1f;
    }
    #github-content td {
      color: #86868b;
    }

    /* === Loading Spinner === */
    .spinner {
      border: 2px solid #f5f5f7;
      border-top: 2px solid #86868b;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* === Footer === */
    .footer {
      text-align: center;
      padding: 40px 24px;
      color: #86868b;
      font-size: 13px;
    }
    .footer a {
      color: #007aff;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }

    /* === Mobile Menu === */
    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: none;
      color: #1d1d1f;
      cursor: pointer;
      padding: 12px;
      border-radius: 8px;
      transition: background 0.2s;
      min-width: 48px;
      min-height: 48px;
    }
    .mobile-menu-btn:hover {
      background: #f5f5f7;
    }
    .mobile-menu-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 150;
      backdrop-filter: blur(4px);
    }
    .mobile-menu-overlay.active {
      display: block;
    }
    .mobile-menu {
      position: fixed;
      top: 0;
      right: -280px;
      width: 280px;
      height: 100%;
      background: #ffffff;
      z-index: 151;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .mobile-menu.active {
      right: 0;
    }
    .mobile-menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #f5f5f7;
    }
    .mobile-menu-header h3 {
      font-size: 16px;
      font-weight: 500;
      color: #1d1d1f;
    }
    .mobile-menu-close {
      background: transparent;
      border: none;
      color: #86868b;
      font-size: 24px;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      min-width: 44px;
      min-height: 44px;
    }
    .mobile-menu-items {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .mobile-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: #1d1d1f;
      text-decoration: none;
      font-size: 15px;
      cursor: pointer;
      transition: background 0.2s;
      min-height: 48px;
      text-align: left;
    }
    .mobile-menu-item:hover {
      background: #f5f5f7;
    }

    /* === Responsive === */
    @media (max-width: 768px) {
      /* Header */
      .nav {
        padding: 0 16px;
      }
      .nav-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .nav-left span:first-child {
        font-size: 18px;
      }
      .nav-right {
        display: none;
      }
      .mobile-menu-btn {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Status badges - stack vertically */
      #server-status,
      .status-badge {
        margin-left: 0 !important;
        margin-top: 4px;
      }

      /* Container */
      .container {
        padding: 0 16px;
      }

      /* Doc navigation */
      .doc-nav-sticky {
        top: 78px;
        padding: 12px 0;
        margin-bottom: 24px;
      }
      .doc-tabs {
        gap: 6px;
      }
      .doc-btn {
        padding: 12px 16px;
        font-size: 13px;
        min-height: 44px;
      }

      /* Content */
      .doc-content {
        padding: 20px 16px;
      }

      /* Typography - smaller on mobile */
      #github-content h1 {
        font-size: 26px;
        margin-bottom: 16px;
      }
      #github-content h2 {
        font-size: 20px;
        margin: 32px 0 12px 0;
      }
      #github-content h3 {
        font-size: 17px;
      }
      #github-content p,
      #github-content li {
        font-size: 14px;
      }

      /* Code blocks - better mobile scrolling */
      #github-content pre {
        padding: 12px;
        margin: 12px -16px;
        border-radius: 0;
        font-size: 13px;
      }
      #github-content pre code {
        font-size: 13px;
      }
      #github-content pre .copy-btn {
        opacity: 1;
        position: sticky;
        right: 8px;
      }

      /* Tables - scroll horizontally */
      #github-content table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
      }
      #github-content th,
      #github-content td {
        padding: 10px 12px;
        font-size: 13px;
      }

      /* TOC Modal - full screen on mobile */
      .toc-modal-content {
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
      .toc-modal-header {
        padding: 16px;
      }
      .toc-modal-body {
        padding: 16px;
      }
      .toc-list a {
        padding: 12px 16px;
        font-size: 15px;
        min-height: 48px;
        display: flex;
        align-items: center;
      }

      /* Touch-optimized buttons */
      .icon-btn {
        min-width: 48px;
        min-height: 48px;
        padding: 12px;
      }
      .nav-link {
        min-height: 48px;
        padding: 12px 16px;
      }

      /* Search expanded */
      .search-expanded .container {
        padding: 0 16px;
      }
      .search-input-expanded {
        font-size: 16px;
        padding: 14px 16px;
      }
      .search-close {
        min-width: 48px;
        min-height: 48px;
      }

      /* Footer */
      .footer {
        padding: 32px 16px;
        font-size: 12px;
      }
    }

    /* Extra small screens */
    @media (max-width: 480px) {
      .nav-left span:first-child {
        font-size: 16px;
      }
      #github-content h1 {
        font-size: 24px;
      }
      #github-content h2 {
        font-size: 18px;
      }
      .doc-btn {
        padding: 10px 14px;
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="nav">
      <div class="nav-left">
        <span style="font-size: 20px; font-weight: 500; letter-spacing: -0.3px;">Skolverket MCP Server</span>
        <span id="server-status" class="status-badge status-checking" style="margin-left: 16px;" title="Kollar serverstatus...">Kollar...</span>
        <span class="status-badge" style="margin-left: 8px;">v2.1.0</span>
      </div>
      <div class="nav-right">
        <button onclick="toggleSearch()" class="icon-btn" id="search-toggle" aria-label="Sök">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
        <button onclick="toggleTOC()" class="icon-btn" id="toc-toggle-btn" aria-label="Innehållsförteckning">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <a href="https://github.com/KSAklfszf921/Skolverket-MCP" target="_blank" class="nav-link">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
      </div>
      <!-- Mobile hamburger menu button -->
      <button onclick="toggleMobileMenu()" class="mobile-menu-btn" aria-label="Meny">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Expandable Search -->
    <div class="search-expanded" id="search-expanded">
      <div class="container">
        <input type="text" id="doc-search" placeholder="Sök i dokumentation..." class="search-input-expanded" autofocus>
        <button onclick="toggleSearch()" class="search-close">✕</button>
      </div>
    </div>
  </div>

  <!-- Mobile Menu Overlay -->
  <div class="mobile-menu-overlay" id="mobile-menu-overlay" onclick="toggleMobileMenu()"></div>

  <!-- Mobile Menu -->
  <div class="mobile-menu" id="mobile-menu">
    <div class="mobile-menu-header">
      <h3>Meny</h3>
      <button onclick="toggleMobileMenu()" class="mobile-menu-close">✕</button>
    </div>
    <div class="mobile-menu-items">
      <button onclick="toggleSearch(); toggleMobileMenu();" class="mobile-menu-item">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <span>Sök</span>
      </button>
      <button onclick="toggleTOC(); toggleMobileMenu();" class="mobile-menu-item">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span>Innehållsförteckning</span>
      </button>
      <a href="https://github.com/KSAklfszf921/Skolverket-MCP" target="_blank" class="mobile-menu-item">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <span>GitHub</span>
      </a>
    </div>
  </div>

  <!-- Progress Bar (subtle) -->
  <div class="progress-bar" id="progress-bar"></div>

  <!-- Sticky Documentation Navigation -->
  <div class="doc-nav-sticky" id="doc-nav">
    <div class="container">
      <div class="doc-tabs">
        <button onclick="loadDoc('README')" class="doc-btn active" id="btn-README">README</button>
        <button onclick="loadDoc('API')" class="doc-btn" id="btn-API">API</button>
        <button onclick="loadDoc('EXAMPLES')" class="doc-btn" id="btn-EXAMPLES">Exempel</button>
      </div>
    </div>
  </div>

  <!-- Table of Contents Modal -->
  <div class="toc-modal" id="toc-modal">
    <div class="toc-modal-content">
      <div class="toc-modal-header">
        <h3>Innehållsförteckning</h3>
        <button onclick="toggleTOC()" class="toc-modal-close">✕</button>
      </div>
      <div class="toc-modal-body" id="toc-content">
        <p style="color: #86868b;">Laddar innehållsförteckning...</p>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="container" style="margin-top: 40px;">
    <div class="doc-content">
      <div id="github-content">
        <div style="text-align: center; padding: 80px 24px; color: #86868b;">
          <div class="spinner"></div>
          <p style="margin-top: 24px;">Laddar dokumentation från GitHub...</p>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>
      Skolverket MCP Server v2.1.0 · Skapad av Isak Skogstad<br>
      <a href="https://github.com/KSAklfszf921/Skolverket-MCP" target="_blank">GitHub</a> ·
      <a href="/playground">🎮 Playground</a> ·
      <a href="/health">Health Check</a> ·
      <a href="https://modelcontextprotocol.io" target="_blank">Om MCP</a>
    </p>
  </div>

  <!-- Marked.js från CDN för markdown rendering -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>


  <script>
    const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/KSAklfszf921/Skolverket-MCP/master/';

    const docs = {
      'README': 'README.md',
      'API': 'docs/API.md',
      'EXAMPLES': 'docs/EXAMPLES.md'
    };

    const docTitles = {
      'README': 'README',
      'API': 'API',
      'EXAMPLES': 'Exempel'
    };

    let currentDoc = 'README';
    let currentMarkdown = '';

    // Check server status on load
    checkServerStatus();
    // Re-check every 30 seconds
    setInterval(checkServerStatus, 30000);

    function checkServerStatus() {
      const statusBadge = document.getElementById('server-status');

      fetch('/health')
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Server svarar inte');
        })
        .then(data => {
          statusBadge.className = 'status-badge status-online';
          statusBadge.textContent = 'Online';
          statusBadge.title = 'MCP-servern är online och svarar korrekt. Alla API:er fungerar.';
        })
        .catch(error => {
          statusBadge.className = 'status-badge status-offline';
          statusBadge.textContent = 'Offline';
          statusBadge.title = 'MCP-servern svarar inte eller har problem. Försök igen senare.';
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // "/" key - Open search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          toggleSearch();
        }
      }
      // Escape key - Close modals
      if (e.key === 'Escape') {
        const searchExpanded = document.getElementById('search-expanded');
        const tocModal = document.getElementById('toc-modal');
        if (searchExpanded.classList.contains('active')) {
          toggleSearch();
        }
        if (tocModal.classList.contains('active')) {
          toggleTOC();
        }
      }
    });

    // Scroll progress tracking
    window.addEventListener('scroll', updateProgressBar);

    function updateProgressBar() {
      const progressBar = document.querySelector('.progress-bar');
      if (!progressBar) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;

      progressBar.style.width = Math.min(progress, 100) + '%';
    }

    function toggleSearch() {
      const searchExpanded = document.getElementById('search-expanded');
      const searchInput = document.getElementById('doc-search');

      searchExpanded.classList.toggle('active');

      if (searchExpanded.classList.contains('active')) {
        setTimeout(() => {
          searchInput.focus();
          searchInput.setAttribute('aria-expanded', 'true');
        }, 100);
      } else {
        searchInput.value = '';
        searchInput.setAttribute('aria-expanded', 'false');
        // Restore original content if search was active
        if (currentMarkdown) {
          document.getElementById('github-content').innerHTML = marked.parse(currentMarkdown);
          generateTOC();
          interceptInternalLinks();
        }
      }
    }

    function toggleTOC() {
      const modal = document.getElementById('toc-modal');
      const isOpening = !modal.classList.contains('active');

      modal.classList.toggle('active');
      modal.setAttribute('aria-hidden', isOpening ? 'false' : 'true');

      // Focus management
      if (isOpening) {
        // Focus first link in TOC when opened
        setTimeout(() => {
          const firstLink = modal.querySelector('.toc-list a');
          if (firstLink) firstLink.focus();
        }, 100);
      }

      // Close modal when clicking outside
      if (modal.classList.contains('active')) {
        modal.onclick = (e) => {
          if (e.target === modal) {
            toggleTOC();
          }
        };
      }
    }

    function toggleMobileMenu() {
      const mobileMenu = document.getElementById('mobile-menu');
      const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

      mobileMenu.classList.toggle('active');
      mobileMenuOverlay.classList.toggle('active');

      // Prevent body scroll when menu is open
      if (mobileMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu.classList.contains('active')) {
          toggleMobileMenu();
        }
      }
    });

    function generateTOC() {
      const contentDiv = document.getElementById('github-content');
      const headings = contentDiv.querySelectorAll('h2, h3');
      const tocContent = document.getElementById('toc-content');

      if (headings.length === 0) {
        tocContent.innerHTML = '<p style="color: #86868b; font-size: 14px;">Inga rubriker hittades</p>';
        return;
      }

      let tocHtml = '<ul class="toc-list">';

      headings.forEach((heading, index) => {
        const text = heading.textContent.trim();
        const level = heading.tagName.toLowerCase();
        const id = 'heading-' + index;

        // Add ID to actual heading in content
        heading.id = id;

        const indent = level === 'h3' ? 'style="padding-left: 20px;"' : '';
        tocHtml += \`
          <li \${indent}>
            <a href="#\${id}" onclick="scrollToHeading('\${id}'); return false;">
              \${text}
            </a>
          </li>
        \`;
      });

      tocHtml += '</ul>';
      tocContent.innerHTML = tocHtml;
    }

    function addCopyButtons() {
      const codeBlocks = document.querySelectorAll('#github-content pre');

      codeBlocks.forEach(pre => {
        // Don't add button if it already exists
        if (pre.querySelector('.copy-btn')) return;

        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');

        button.addEventListener('click', async () => {
          const code = pre.querySelector('code');
          const text = code ? code.textContent : pre.textContent;

          try {
            await navigator.clipboard.writeText(text);
            button.textContent = 'Copied!';
            button.classList.add('copied');

            setTimeout(() => {
              button.textContent = 'Copy';
              button.classList.remove('copied');
            }, 2000);
          } catch (err) {
            button.textContent = 'Error';
            setTimeout(() => {
              button.textContent = 'Copy';
            }, 2000);
          }
        });

        pre.appendChild(button);
      });
    }

    function scrollToHeading(id) {
      const element = document.getElementById(id);
      if (element) {
        // Close TOC modal if open
        const modal = document.getElementById('toc-modal');
        if (modal.classList.contains('active')) {
          modal.classList.remove('active');
        }
        // Scroll to element with offset for sticky header
        const headerHeight = 140; // Header + nav height
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }

    function interceptInternalLinks() {
      const contentDiv = document.getElementById('github-content');
      const links = contentDiv.querySelectorAll('a');

      // Map file paths to document names
      const pathToDoc = {
        'docs/API.md': 'API',
        'API.md': 'API',
        'docs/EXAMPLES.md': 'EXAMPLES',
        'EXAMPLES.md': 'EXAMPLES',
        'README.md': 'README'
      };

      links.forEach(link => {
        const href = link.getAttribute('href');

        // Check if it's an internal markdown link
        if (href && href.endsWith('.md') && !href.startsWith('http')) {
          link.addEventListener('click', (e) => {
            e.preventDefault();

            // Extract filename from path
            const filename = href.split('/').pop() || href;
            const fullPath = href;

            // Try to find matching document
            let docName = pathToDoc[fullPath] || pathToDoc[filename];

            if (docName) {
              loadDoc(docName);
            } else {
              // If no match, show error
              console.warn('Unknown document link:', href);
            }
          });
        }

        // Make external links open in new tab
        if (href && (href.startsWith('http') || href.startsWith('//'))) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      });
    }

    function setupSearch() {
      const searchInput = document.getElementById('doc-search');
      const contentDiv = document.getElementById('github-content');

      let searchTimeout;

      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
          const searchTerm = e.target.value.toLowerCase().trim();

          if (!searchTerm) {
            // Restore original content
            contentDiv.innerHTML = marked.parse(currentMarkdown);
            generateTOC();
            interceptInternalLinks();
            return;
          }

          // Parse markdown and filter content
          const html = marked.parse(currentMarkdown);
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Highlight matching text
          const walker = document.createTreeWalker(
            doc.body,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node;
          const nodesToHighlight = [];

          while (node = walker.nextNode()) {
            if (node.textContent.toLowerCase().includes(searchTerm)) {
              nodesToHighlight.push(node);
            }
          }

          nodesToHighlight.forEach(textNode => {
            const text = textNode.textContent;
            const regex = new RegExp(\`(\${searchTerm})\`, 'gi');
            const highlightedText = text.replace(regex, '<mark style="background: #007aff; color: white; padding: 2px 6px; border-radius: 4px;">$1</mark>');

            const span = document.createElement('span');
            span.innerHTML = highlightedText;
            textNode.parentNode.replaceChild(span, textNode);
          });

          contentDiv.innerHTML = doc.body.innerHTML;

          // Show search result count
          const matchCount = nodesToHighlight.length;
          if (matchCount === 0) {
            contentDiv.innerHTML = \`
              <div style="text-align: center; padding: 80px 24px; color: #86868b;">
                <p style="font-size: 18px; font-weight: 500;">Inga resultat</p>
                <p style="margin-top: 8px;">Inga matchningar för "\${searchTerm}"</p>
              </div>
            \` + contentDiv.innerHTML;
          }
        }, 300);
      });
    }

    async function loadDoc(docName) {
      const contentDiv = document.getElementById('github-content');
      const buttons = document.querySelectorAll('.doc-btn');

      currentDoc = docName;

      // Update active button
      buttons.forEach(btn => btn.classList.remove('active'));
      document.getElementById('btn-' + docName).classList.add('active');

      // Clear search
      const searchInput = document.getElementById('doc-search');
      if (searchInput) searchInput.value = '';

      // Check cache first (5 min TTL)
      const cacheKey = 'doc_' + docName;
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(cacheKey + '_time');
      const now = Date.now();
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      if (cached && cacheTime && (now - parseInt(cacheTime)) < CACHE_TTL) {
        // Use cached version
        currentMarkdown = cached;
        const html = marked.parse(cached);
        contentDiv.innerHTML = html;

        generateTOC();
        interceptInternalLinks();
        addCopyButtons();

        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateProgressBar();
        return;
      }

      // Show loading spinner
      contentDiv.innerHTML = \`
        <div style="text-align: center; padding: 80px 24px; color: #86868b;">
          <div class="spinner"></div>
          <p style="margin-top: 24px;">Laddar \${docTitles[docName]}...</p>
        </div>
      \`;

      document.getElementById('toc-content').innerHTML = '<p style="color: #86868b;">Laddar innehållsförteckning...</p>';

      try {
        const response = await fetch(GITHUB_RAW_BASE + docs[docName]);
        if (!response.ok) throw new Error('Failed to fetch');

        const markdown = await response.text();
        currentMarkdown = markdown;

        // Cache the markdown
        sessionStorage.setItem(cacheKey, markdown);
        sessionStorage.setItem(cacheKey + '_time', now.toString());

        const html = marked.parse(markdown);

        contentDiv.innerHTML = html;

        // Generate Table of Contents
        generateTOC();

        // Intercept internal markdown links
        interceptInternalLinks();

        // Add copy buttons to code blocks
        addCopyButtons();

        // Smooth scroll to content
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Reset progress bar
        updateProgressBar();
      } catch (error) {
        contentDiv.innerHTML = \`
          <div style="text-align: center; padding: 80px 24px;">
            <p style="color: #ff3b30; font-weight: 500; font-size: 16px;">Kunde inte ladda dokumentation</p>
            <p style="color: #86868b; margin-top: 12px;">Kontrollera att GitHub är tillgängligt eller besök
              <a href="https://github.com/KSAklfszf921/Skolverket-MCP" target="_blank" style="color: #007aff;">repot direkt</a>
            </p>
          </div>
        \`;
        document.getElementById('toc-content').innerHTML = '<p style="color: #86868b;">Ingen innehållsförteckning tillgänglig</p>';
      }
    }

    // Initialize when page loads
    if (typeof marked !== 'undefined') {
      loadDoc('README');
      setupSearch();
    } else {
      // Retry after marked.js loads
      setTimeout(() => {
        loadDoc('README');
        setupSearch();
      }, 100);
    }
  </script>
</body>
</html>
  `);
});

// MCP endpoint - Create new transport for each request
app.post('/mcp', async (req, res) => {
  log.info('MCP request received', {
    method: req.body?.method,
    id: req.body?.id
  });

  try {
    // Create a new transport for this request
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
      // enableJsonResponse removed to allow SSE streaming
    });

    // Close transport when response closes
    res.on('close', () => {
      transport.close();
    });

    // Connect server to transport
    await mcpServer.connect(transport);

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    log.error('MCP request failed', { error });

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        },
        id: req.body?.id || null
      });
    }
  }
});

// ==============================================
// START SERVER
// ==============================================

app.listen(PORT, () => {
  log.info('Skolverket MCP Server (HTTP/SSE) started', {
    port: PORT,
    endpoint: `/mcp`,
    version: '2.1.0',
    capabilities: ['tools', 'resources', 'prompts', 'logging'],
    apis: ['Läroplan API', 'Skolenhetsregistret API', 'Planned Educations API']
  });

  console.error(`🚀 Skolverket MCP Server listening on http://localhost:${PORT}`);
  console.error(`📡 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.error(`💚 Health check: http://localhost:${PORT}/health`);
});
