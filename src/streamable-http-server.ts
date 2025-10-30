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
  <title>Skolverket MCP Server - Model Context Protocol för svenska läroplaner</title>

  <!-- SEO Meta Tags -->
  <meta name="description" content="MCP server för Skolverkets API:er. Anslut ChatGPT, Claude, och andra AI-assistenter till svenska läroplaner, skolenheter och utbildningar.">
  <meta name="keywords" content="skolverket, mcp, model context protocol, läroplan, chatgpt, claude, ai, utbildning, sweden">
  <meta name="author" content="Isak Skogstad">

  <!-- Open Graph / Social Media Meta Tags -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${req.protocol}://${req.get('host')}/">
  <meta property="og:title" content="Skolverket MCP Server - AI-tillgång till svenska läroplaner">
  <meta property="og:description" content="Anslut ChatGPT, Claude och andra AI-assistenter till Skolverkets officiella API:er. 29 verktyg för läroplaner, skolenheter och vuxenutbildning.">
  <meta property="og:image" content="${req.protocol}://${req.get('host')}/og-image.png">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Skolverket MCP Server">
  <meta name="twitter:description" content="MCP server för Skolverkets API:er. 29 verktyg för AI-assistenter.">
  <meta name="twitter:image" content="${req.protocol}://${req.get('host')}/og-image.png">

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
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 980px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .nav-left { display: flex; align-items: center; gap: 8px; }
    .nav-right { display: flex; gap: 16px; }
    .nav-link {
      color: #1d1d1f;
      text-decoration: none;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 8px;
      transition: background 0.2s;
    }
    .nav-link:hover { background: #f5f5f7; }
    .github-btn {
      background: #1d1d1f;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .github-btn:hover { background: #424245; }
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
    <div class="nav">
      <div class="nav-left">
        <span style="font-size: 18px; font-weight: 600;">Skolverket MCP</span>
        <span class="status-badge active" style="margin-left: 8px;">● Online</span>
      </div>
      <div class="nav-right">
        <a href="#quick-start" class="nav-link">Snabbstart</a>
        <a href="#api" class="nav-link">API</a>
        <a href="#faq" class="nav-link">FAQ</a>
        <a href="/health" class="nav-link">Status</a>
        <a href="https://github.com/KSAklfszf921/skolverket-mcp" target="_blank" class="github-btn">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          GitHub
        </a>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="hero">
      <h1>Skolverket MCP Server</h1>
      <p class="subtitle">Model Context Protocol Server för Skolverkets öppna API:er</p>
      <div class="status-bar">
        <span class="status-badge active">● Online</span>
        <span class="status-badge">Version 2.1.0</span>
        <span class="status-badge">29 verktyg</span>
        <span class="status-badge">HTTP Transport</span>
      </div>
    </div>

    <!-- Kort beskrivning -->
    <div class="section" style="margin-top: 0;">
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.6;">
        Skolverket MCP Server ger AI-assistenter tillgång till Skolverkets officiella API:er.
        Integration med ChatGPT, Claude och andra MCP-kompatibla system för att hämta svenska läroplaner,
        skolenheter och utbildningar.
      </p>
      <p style="font-size: 15px; color: #6e6e73; margin-top: 16px; line-height: 1.6;">
        <strong>MCP Endpoint:</strong> <code style="background: #f5f5f7; padding: 3px 8px; border-radius: 4px; font-size: 14px;">${req.protocol}://${req.get('host')}/mcp</code><br>
        <strong>Skapad av:</strong> Isak Skogstad ·
        <strong>Hosting:</strong> <a href="https://render.com" target="_blank" style="color: #0066cc;">Render.com</a> ·
        <strong>Licens:</strong> MIT Open Source
      </p>
    </div>
  </div>

  <!-- Dynamiska GitHub Docs Sektioner -->
  <div class="container" style="margin-top: 40px;">
    <div class="section">
      <h2>📖 Dokumentation (Live från GitHub)</h2>
      <p style="color: #6e6e73; margin-bottom: 24px;">
        Följande dokumentation hämtas direkt från GitHub-repot och uppdateras automatiskt:
      </p>

      <div style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
        <button onclick="loadDoc('README')" class="doc-btn active" id="btn-README">README</button>
        <button onclick="loadDoc('INSTALLATION')" class="doc-btn" id="btn-INSTALLATION">Installation</button>
        <button onclick="loadDoc('API')" class="doc-btn" id="btn-API">API</button>
        <button onclick="loadDoc('EXAMPLES')" class="doc-btn" id="btn-EXAMPLES">Exempel</button>
        <button onclick="loadDoc('CHANGES')" class="doc-btn" id="btn-CHANGES">Ändringslogg</button>
      </div>

      <div id="github-content" style="background: white; border-radius: 8px; padding: 24px; border: 1px solid #e5e5e7;">
        <div style="text-align: center; padding: 40px; color: #6e6e73;">
          <div class="spinner"></div>
          <p style="margin-top: 16px;">Laddar dokumentation från GitHub...</p>
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

  <!-- Marked.js från CDN för markdown rendering -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

  <style>
    .doc-btn {
      background: #f5f5f7;
      border: 1px solid #e5e5e7;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .doc-btn:hover {
      background: #e5e5e7;
    }
    .doc-btn.active {
      background: #1d1d1f;
      color: white;
      border-color: #1d1d1f;
    }
    .spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto;
      border: 3px solid #f5f5f7;
      border-top-color: #0066cc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    #github-content h1, #github-content h2, #github-content h3 {
      margin-top: 24px;
      margin-bottom: 12px;
    }
    #github-content h1 { font-size: 32px; font-weight: 600; }
    #github-content h2 { font-size: 24px; font-weight: 600; }
    #github-content h3 { font-size: 19px; font-weight: 600; }
    #github-content p { margin-bottom: 16px; line-height: 1.6; color: #1d1d1f; }
    #github-content pre {
      background: #1d1d1f;
      color: #f5f5f7;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 16px 0;
    }
    #github-content code {
      background: #f5f5f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 90%;
    }
    #github-content pre code {
      background: transparent;
      padding: 0;
    }
    #github-content ul, #github-content ol {
      margin: 16px 0 16px 24px;
      line-height: 1.8;
    }
    #github-content blockquote {
      border-left: 4px solid #e5e5e7;
      padding-left: 16px;
      margin: 16px 0;
      color: #6e6e73;
    }
    #github-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    #github-content th, #github-content td {
      border: 1px solid #e5e5e7;
      padding: 8px 12px;
      text-align: left;
    }
    #github-content th {
      background: #f5f5f7;
      font-weight: 600;
    }
    #github-content a {
      color: #0066cc;
      text-decoration: none;
    }
    #github-content a:hover {
      text-decoration: underline;
    }
  </style>

  <script>
    const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/KSAklfszf921/skolverket-mcp/master/';

    const docs = {
      'README': 'README.md',
      'INSTALLATION': 'INSTALLATION.md',
      'API': 'docs/API.md',
      'EXAMPLES': 'docs/EXAMPLES.md',
      'CHANGES': 'CHANGES.md'
    };

    async function loadDoc(docName) {
      const contentDiv = document.getElementById('github-content');
      const buttons = document.querySelectorAll('.doc-btn');

      // Update active button
      buttons.forEach(btn => btn.classList.remove('active'));
      document.getElementById('btn-' + docName).classList.add('active');

      // Show loading spinner
      contentDiv.innerHTML = \`
        <div style="text-align: center; padding: 40px; color: #6e6e73;">
          <div class="spinner"></div>
          <p style="margin-top: 16px;">Laddar \${docName}...</p>
        </div>
      \`;

      try {
        const response = await fetch(GITHUB_RAW_BASE + docs[docName]);
        if (!response.ok) throw new Error('Failed to fetch');

        const markdown = await response.text();
        const html = marked.parse(markdown);

        contentDiv.innerHTML = html;

        // Smooth scroll to content
        contentDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (error) {
        contentDiv.innerHTML = \`
          <div style="text-align: center; padding: 40px;">
            <p style="color: #d32f2f; font-weight: 500;">❌ Kunde inte ladda dokumentation</p>
            <p style="color: #6e6e73; margin-top: 8px;">Kontrollera att GitHub är tillgängligt eller besök
              <a href="https://github.com/KSAklfszf921/skolverket-mcp" target="_blank" style="color: #0066cc;">repot direkt</a>
            </p>
          </div>
        \`;
      }
    }

    // Load README by default when page loads
    if (typeof marked !== 'undefined') {
      loadDoc('README');
    } else {
      // Retry after marked.js loads
      setTimeout(() => loadDoc('README'), 100);
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
