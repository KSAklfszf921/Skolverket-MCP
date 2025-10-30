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
            timespan: { type: 'string', description: 'Tidsperiod: LATEST, HISTORICAL, ALL' }
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
            timespan: { type: 'string', description: 'Tidsperiod' }
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
            timespan: { type: 'string', description: 'Tidsperiod' }
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
            timespan: { type: 'string', description: 'Tidsperiod' }
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'skolverket-mcp',
    version: '2.1.0',
    transport: 'streamable-http'
  });
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
  <title>Skolverket MCP Server - Model Context Protocol</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f5f7;
      color: #1d1d1f;
      line-height: 1.6;
    }
    .header {
      background: white;
      border-bottom: 1px solid #e5e5e7;
      padding: 20px 0;
    }
    .container {
      max-width: 980px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .hero {
      text-align: center;
      padding: 60px 0 40px;
    }
    h1 {
      font-size: 48px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 21px;
      color: #6e6e73;
      font-weight: 400;
      margin-bottom: 8px;
    }
    .status-bar {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    .status-badge {
      background: #f5f5f7;
      color: #1d1d1f;
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 14px;
      border: 1px solid #e5e5e7;
    }
    .status-badge.active { background: #e8f5e9; border-color: #4caf50; color: #2e7d32; }

    .section {
      background: white;
      border-radius: 12px;
      padding: 32px;
      margin: 24px 0;
      border: 1px solid #e5e5e7;
    }
    .section h2 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1d1d1f;
    }
    .section h3 {
      font-size: 21px;
      font-weight: 600;
      margin: 24px 0 12px;
      color: #1d1d1f;
    }
    .section p {
      color: #6e6e73;
      margin-bottom: 16px;
      font-size: 17px;
    }

    .endpoint-box {
      background: #f5f5f7;
      border: 1px solid #e5e5e7;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 15px;
    }
    .endpoint-url {
      color: #0066cc;
      font-weight: 500;
    }

    .guide {
      background: #fafafa;
      border-left: 3px solid #0066cc;
      padding: 20px;
      margin: 16px 0;
      border-radius: 4px;
    }
    .guide-title {
      font-weight: 600;
      color: #0066cc;
      margin-bottom: 12px;
      font-size: 17px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .guide-steps {
      color: #6e6e73;
      font-size: 15px;
    }
    .guide-steps ol {
      margin-left: 20px;
      margin-top: 8px;
    }
    .guide-steps li {
      margin: 8px 0;
      padding-left: 4px;
    }
    .guide-steps code {
      background: #e5e5e7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 14px;
      color: #1d1d1f;
    }

    .api-list {
      display: grid;
      gap: 16px;
      margin-top: 16px;
    }
    .api-item {
      background: #fafafa;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e5e5e7;
    }
    .api-item strong {
      color: #1d1d1f;
      display: block;
      margin-bottom: 4px;
    }
    .api-item span {
      color: #6e6e73;
      font-size: 15px;
    }

    .footer {
      text-align: center;
      padding: 40px 20px;
      color: #6e6e73;
      font-size: 14px;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <div class="hero">
        <h1>Skolverket MCP Server</h1>
        <p class="subtitle">Model Context Protocol Server för Skolverkets öppna API:er</p>
        <div class="status-bar">
          <span class="status-badge active">● Online</span>
          <span class="status-badge">Version 2.1.0</span>
          <span class="status-badge">29 verktyg</span>
          <span class="status-badge">HTTP/SSE Transport</span>
        </div>
      </div>
    </div>
  </div>

  <div class="container">
    <!-- Om tjänsten -->
    <div class="section">
      <h2>Om tjänsten</h2>
      <p>
        Skolverket MCP Server är en Model Context Protocol-server som ger AI-assistenter tillgång
        till Skolverkets officiella API:er. Servern möjliggör integration med verktyg som ChatGPT,
        Claude, och andra MCP-kompatibla AI-system för att hämta information om svenska läroplaner,
        skolenheter och utbildningar.
      </p>
      <p>
        <strong>Skapad av:</strong> Isak Skogstad<br>
        <strong>Källkod:</strong> <a href="https://github.com/KSAklfszf921/skolverket-mcp" target="_blank">GitHub Repository</a><br>
        <strong>Licens:</strong> Open Source
      </p>
    </div>

    <!-- MCP Endpoint -->
    <div class="section">
      <h2>MCP Endpoint</h2>
      <p>Anslut din MCP-klient till följande endpoint:</p>
      <div class="endpoint-box">
        <strong>POST</strong> <span class="endpoint-url">${req.protocol}://${req.get('host')}/mcp</span>
      </div>
      <p style="font-size: 15px; color: #86868b;">
        Servern använder Streamable HTTP transport med Server-Sent Events (SSE)
        och stöder MCP protocol version 2024-11-05.
      </p>
    </div>

    <!-- Tillgängliga API:er -->
    <div class="section">
      <h2>Tillgängliga API:er</h2>
      <p>Servern exponerar 29 verktyg från tre olika Skolverket API:er:</p>

      <div class="api-list">
        <div class="api-item">
          <strong>Läroplan API (Syllabus)</strong>
          <span>Sök ämnen, kurser, gymnasieprogram, och läroplaner. Hämta detaljerad information
          om kursinnehåll, centralt innehåll, kunskapskrav och versionshistorik.</span>
        </div>

        <div class="api-item">
          <strong>Skolenhetsregistret</strong>
          <span>Sök och hämta information om Sveriges skolenheter. Filtrera efter status,
          namn eller skolenhetskod. Få tillgång till adresser, huvudmän och kontaktinformation.</span>
        </div>

        <div class="api-item">
          <strong>Planned Educations API</strong>
          <span>Utforska vuxenutbildningar som yrkeshögskola (YH), SFI och komvux.
          Filtrera efter studietakt, distans/campus, stad och utbildningsområde.</span>
        </div>
      </div>
    </div>

    <!-- Anslutningsguider -->
    <div class="section">
      <h2>Anslutningsguider</h2>
      <p>Instruktioner för att ansluta servern till populära AI-tjänster:</p>

      <!-- ChatGPT -->
      <div class="guide">
        <div class="guide-title">
          <span>🤖</span> ChatGPT (OpenAI)
        </div>
        <div class="guide-steps">
          <ol>
            <li>Öppna <strong>ChatGPT</strong> och gå till inställningar</li>
            <li>Välj <strong>"Customize ChatGPT"</strong> → <strong>"Actions"</strong></li>
            <li>Klicka på <strong>"Create new action"</strong></li>
            <li>Lägg till server URL: <code>${req.protocol}://${req.get('host')}/mcp</code></li>
            <li>Välj <strong>POST</strong> method och <strong>Server-Sent Events</strong></li>
            <li>Spara och aktivera action</li>
          </ol>
          <p style="margin-top: 12px; font-style: italic;">
            ChatGPT kan nu använda Skolverkets API:er för att svara på frågor om svenska läroplaner.
          </p>
        </div>
      </div>

      <!-- Claude Code -->
      <div class="guide">
        <div class="guide-title">
          <span>⚡</span> Claude Code (Anthropic)
        </div>
        <div class="guide-steps">
          <ol>
            <li>Öppna din <code>~/.claude/config.json</code></li>
            <li>Lägg till under <code>"mcpServers"</code>:
              <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; margin-top: 8px; overflow-x: auto; font-size: 13px;">"skolverket": {
  "url": "${req.protocol}://${req.get('host')}/mcp",
  "transport": "sse"
}</pre>
            </li>
            <li>Starta om Claude Code</li>
            <li>Servern är nu tillgänglig för alla konversationer</li>
          </ol>
        </div>
      </div>

      <!-- Gemini -->
      <div class="guide">
        <div class="guide-title">
          <span>💎</span> Gemini (Google)
        </div>
        <div class="guide-steps">
          <ol>
            <li>Öppna <strong>Google AI Studio</strong></li>
            <li>Gå till <strong>"Extensions"</strong> eller <strong>"Tools"</strong></li>
            <li>Välj <strong>"Add MCP Server"</strong></li>
            <li>Ange URL: <code>${req.protocol}://${req.get('host')}/mcp</code></li>
            <li>Välj transport: <strong>HTTP with SSE</strong></li>
            <li>Spara och aktivera</li>
          </ol>
        </div>
      </div>

      <!-- Grok -->
      <div class="guide">
        <div class="guide-title">
          <span>🚀</span> Grok (xAI)
        </div>
        <div class="guide-steps">
          <ol>
            <li>Öppna <strong>Grok</strong> i X (Twitter)</li>
            <li>Klicka på <strong>inställningar</strong> (kugghjul)</li>
            <li>Välj <strong>"External Tools"</strong> eller <strong>"Integrations"</strong></li>
            <li>Lägg till MCP Server URL: <code>${req.protocol}://${req.get('host')}/mcp</code></li>
            <li>Välj <strong>SSE transport</strong></li>
            <li>Aktivera och testa anslutningen</li>
          </ol>
        </div>
      </div>

      <!-- Generisk MCP-klient -->
      <div class="guide">
        <div class="guide-title">
          <span>🔧</span> MCP Inspector (Testverktyg)
        </div>
        <div class="guide-steps">
          <ol>
            <li>Installera MCP Inspector:
              <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; margin-top: 8px; overflow-x: auto; font-size: 13px;">npx @modelcontextprotocol/inspector</pre>
            </li>
            <li>Öppna webbläsaren på den URL som visas</li>
            <li>Ange Server URL: <code>${req.protocol}://${req.get('host')}/mcp</code></li>
            <li>Välj transport: <strong>HTTP with SSE</strong></li>
            <li>Klicka <strong>"Connect"</strong> och utforska alla verktyg</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Exempel på användning -->
    <div class="section">
      <h2>Exempel på användning</h2>
      <p>När servern är ansluten kan du ställa frågor som:</p>
      <ul style="margin-left: 24px; color: #6e6e73; margin-top: 12px;">
        <li style="margin: 8px 0;">"Vilka kurser finns i ämnet matematik för gymnasiet?"</li>
        <li style="margin: 8px 0;">"Vad säger läroplanen om centralt innehåll i Svenska 1?"</li>
        <li style="margin: 8px 0;">"Hitta alla yrkeshögskoleutbildningar inom IT i Stockholm"</li>
        <li style="margin: 8px 0;">"Lista alla skolenheter i Göteborg"</li>
        <li style="margin: 8px 0;">"Vilka kunskapskrav finns för betyget A i Engelska 5?"</li>
      </ul>
    </div>

    <!-- Teknisk information -->
    <div class="section">
      <h2>Teknisk information</h2>
      <div style="display: grid; gap: 12px; margin-top: 16px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e7;">
          <span style="color: #6e6e73;">Protocol Version</span>
          <strong>MCP 2024-11-05</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e7;">
          <span style="color: #6e6e73;">Transport</span>
          <strong>HTTP with Server-Sent Events</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e7;">
          <span style="color: #6e6e73;">Runtime</span>
          <strong>Node.js 20</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e7;">
          <span style="color: #6e6e73;">Hosting</span>
          <strong>Render</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6e6e73;">Health Endpoint</span>
          <strong><a href="/health" style="color: #0066cc; text-decoration: none;">/health</a></strong>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>
      Skolverket MCP Server v2.1.0 · Skapad av Isak Skogstad<br>
      <a href="https://github.com/KSAklfszf921/skolverket-mcp" target="_blank">GitHub</a> ·
      <a href="/health">Health Check</a> ·
      <a href="https://modelcontextprotocol.io" target="_blank">Om MCP</a>
    </p>
  </div>
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
