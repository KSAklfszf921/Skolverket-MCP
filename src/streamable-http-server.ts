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
        <span class="status-badge">Version 2.1.0</span>
        <span class="status-badge">29 verktyg</span>
        <span class="status-badge">HTTP Transport</span>
        <span class="status-badge">Render Starter</span>
      </div>
    </div>
  </div>

  <div class="container">
    <!-- Om tjänsten -->
    <div class="section">
      <h2>Om tjänsten</h2>
      <p>
        Skolverket MCP Server ger AI-assistenter tillgång till Skolverkets officiella API:er.
        Integration med ChatGPT, Claude och andra MCP-kompatibla system för att hämta svenska läroplaner,
        skolenheter och utbildningar.
      </p>
      <p style="font-size: 15px; color: #6e6e73; margin-top: 12px;">
        <strong>Skapad av:</strong> Isak Skogstad (<a href="mailto:isak.skogstad@me.com">isak.skogstad@me.com</a>)<br>
        <strong>Källkod:</strong> <a href="https://github.com/KSAklfszf921/skolverket-mcp" target="_blank">GitHub</a> ·
        <strong>Hosting:</strong> <a href="https://render.com" target="_blank">Render.com (Starter)</a><br>
        <strong>Licens:</strong> MIT Open Source
      </p>
    </div>

    <!-- Quick Start -->
    <div class="section" id="quick-start">
      <h2>⚡ Quick Start (30 sekunder)</h2>
      <div style="background: #f5f5f7; padding: 20px; border-radius: 8px; border-left: 3px solid #0066cc;">
        <h3 style="margin-top: 0;">För ChatGPT (Plus/Pro/Enterprise)</h3>
        <ol style="margin: 12px 0 0 20px; color: #6e6e73;">
          <li>Öppna <strong>Settings</strong> → <strong>Connectors</strong> → <strong>Developer Mode</strong></li>
          <li>Add MCP Server: <code style="background: #e5e5e7; padding: 2px 6px; border-radius: 4px;">${req.protocol}://${req.get('host')}/mcp</code></li>
          <li>Transport: <strong>HTTP with SSE</strong></li>
        </ol>
        <p style="margin: 12px 0 0; font-size: 14px; color: #d32f2f; font-style: italic;">
          ⚠️ Developer Mode är "powerful but dangerous" - granska alltid verktygsanrop!
        </p>
      </div>

      <div style="background: #f5f5f7; padding: 20px; border-radius: 8px; border-left: 3px solid #0066cc; margin-top: 16px;">
        <h3 style="margin-top: 0;">För Claude Code (CLI)</h3>
        <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px;">claude mcp add --transport http skolverket ${req.protocol}://${req.get('host')}/mcp</pre>
        <p style="margin: 8px 0 0; font-size: 14px; color: #86868b;">Starta om Claude Code och kör <code style="background: #e5e5e7; padding: 2px 6px; border-radius: 4px;">claude mcp list</code> för att verifiera.</p>
      </div>
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

    <!-- API Dokumentation -->
    <div class="section" id="api">
      <h2>📚 API-dokumentation (29 verktyg)</h2>
      <p>Servern ger tillgång till tre Skolverkets API:er:</p>

      <div class="api-list">
        <div class="api-item">
          <strong>📖 Läroplan API (17 verktyg)</strong>
          <span>Ämnen, kurser, gymnasieprogram, läroplaner, kunskapskrav, centralt innehåll, versionshistorik</span>
        </div>
        <div class="api-item">
          <strong>🏫 Skolenhetsregistret (4 verktyg)</strong>
          <span>Sök skolenheter, filtrera efter status, hämta detaljer, adresser och huvudmän</span>
        </div>
        <div class="api-item">
          <strong>🎓 Planned Educations (6 verktyg)</strong>
          <span>Yrkeshögskola (YH), SFI, Komvux, filtrera efter studietakt och distans</span>
        </div>
        <div class="api-item">
          <strong>🔧 Diagnostik (1 verktyg)</strong>
          <span>Health check för att testa API-anslutningar och systemstatus</span>
        </div>
        <div class="api-item">
          <strong>📚 Resources (4 st)</strong>
          <span>Statisk data: API-info, skoltyper, läroplanstyper, utbildningsområden</span>
        </div>
        <div class="api-item">
          <strong>💡 Prompts (5 st)</strong>
          <span>Guidade workflows: kursanalys, versionsjämförelse, studievägledning</span>
        </div>
      </div>

      <details style="margin-top: 16px;">
        <summary style="cursor: pointer; font-weight: 600; color: #0066cc; margin-bottom: 8px;">Visa alla 29 verktyg →</summary>
        <div style="font-size: 14px; color: #6e6e73; line-height: 1.8; margin-left: 16px;">
          <strong>Läroplan API:</strong> search_subjects, get_subject_details, get_subject_versions, search_courses, get_course_details, get_course_versions, search_programs, get_program_details, get_program_versions, search_curriculums, get_curriculum_details, get_curriculum_versions, get_school_types, get_types_of_syllabus, get_subject_and_course_codes, get_study_path_codes, get_api_info<br><br>
          <strong>Skolenheter:</strong> search_school_units, get_school_unit_details, get_school_units_by_status, search_school_units_by_name<br><br>
          <strong>Vuxenutbildning:</strong> search_adult_education, get_adult_education_details, filter_adult_education_by_distance, filter_adult_education_by_pace, get_education_areas, get_directions<br><br>
          <strong>Diagnostik:</strong> health_check
        </div>
      </details>
    </div>

    <!-- FAQ -->
    <div class="section" id="faq">
      <h2>❓ FAQ (Vanliga frågor)</h2>

      <details style="margin: 12px 0;">
        <summary style="cursor: pointer; font-weight: 600; color: #1d1d1f; padding: 8px 0;">Vad är Render Starter-planen och vilka begränsningar finns?</summary>
        <p style="margin: 8px 0 0 16px; color: #6e6e73; font-size: 15px;">
          Servern körs på Render.com Starter-plan ($7/månad) med följande specifikationer:<br>
          • <strong>RAM:</strong> 512 MB<br>
          • <strong>CPU:</strong> 0.1 vCPU (shared)<br>
          • <strong>Bandbredd:</strong> 100 GB/månad<br>
          • <strong>Sleep:</strong> Ingen automatisk sleep<br>
          • <strong>Uptime:</strong> 99.9% SLA<br>
          • <strong>Region:</strong> Frankfurt (EU)<br><br>
          <em>Servern kan hantera ~1000 requests/minut. Vid högre belastning, överväg att köra egen instans.</em>
        </p>
      </details>

      <details style="margin: 12px 0;">
        <summary style="cursor: pointer; font-weight: 600; color: #1d1d1f; padding: 8px 0;">Vilka rate limits och tekniska begränsningar finns?</summary>
        <p style="margin: 8px 0 0 16px; color: #6e6e73; font-size: 15px;">
          • <strong>API timeout:</strong> 30 sekunder per request<br>
          • <strong>Max retries:</strong> 3 automatiska omförsök<br>
          • <strong>Concurrent requests:</strong> Max 5 samtidiga anrop<br>
          • <strong>Cache:</strong> Aktiverad (24h för statisk data)<br>
          • <strong>Skolverkets API:</strong> Inga officiella rate limits dokumenterade<br><br>
          <em>Servern har inbyggd rate limiting och retry-logik för optimal prestanda.</em>
        </p>
      </details>

      <details style="margin: 12px 0;">
        <summary style="cursor: pointer; font-weight: 600; color: #1d1d1f; padding: 8px 0;">Hur ser jag server status och uptime?</summary>
        <p style="margin: 8px 0 0 16px; color: #6e6e73; font-size: 15px;">
          Besök <a href="/health" style="color: #0066cc;">/health</a> för real-time health check.<br>
          För Render.com deployment status: <a href="https://dashboard.render.com/web/srv-d41pc29r0fns739dmnk0" target="_blank" style="color: #0066cc;">Render Dashboard</a><br><br>
          <em>Health endpoint visar version, status och transport-information.</em>
        </p>
      </details>

      <details style="margin: 12px 0;">
        <summary style="cursor: pointer; font-weight: 600; color: #1d1d1f; padding: 8px 0;">Kan jag köra servern lokalt eller på egen hosting?</summary>
        <p style="margin: 8px 0 0 16px; color: #6e6e73; font-size: 15px;">
          Ja! Servern är open source (MIT-licens). För lokal körning:<br>
          <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; margin-top: 8px; overflow-x: auto; font-size: 13px;">git clone https://github.com/KSAklfszf921/skolverket-mcp.git
cd skolverket-mcp
npm install
npm run build
npm run start:streamable</pre>
          <em>Kräver Node.js 20+. Se <a href="https://github.com/KSAklfszf921/skolverket-mcp#readme" target="_blank" style="color: #0066cc;">README</a> för detaljerad dokumentation.</em>
        </p>
      </details>

      <details style="margin: 12px 0;">
        <summary style="cursor: pointer; font-weight: 600; color: #1d1d1f; padding: 8px 0;">Hur rapporterar jag buggar eller begär nya funktioner?</summary>
        <p style="margin: 8px 0 0 16px; color: #6e6e73; font-size: 15px;">
          Öppna ett issue på <a href="https://github.com/KSAklfszf921/skolverket-mcp/issues" target="_blank" style="color: #0066cc;">GitHub Issues</a><br>
          Eller kontakta: <a href="mailto:isak.skogstad@me.com" style="color: #0066cc;">isak.skogstad@me.com</a><br><br>
          <em>Bidrag är välkomna! Se <a href="https://github.com/KSAklfszf921/skolverket-mcp/blob/master/CONTRIBUTING.md" target="_blank" style="color: #0066cc;">bidragsguide</a>.</em>
        </p>
      </details>

      <details style="margin: 12px 0;">
        <summary style="cursor: pointer; font-weight: 600; color: #1d1d1f; padding: 8px 0;">Vilka AI-plattformar stöds?</summary>
        <p style="margin: 8px 0 0 16px; color: #6e6e73; font-size: 15px;">
          Servern är kompatibel med alla MCP-stödda plattformar:<br>
          • ✅ ChatGPT (Plus, Pro, Business, Enterprise, Education)<br>
          • ✅ Claude Code (via CLI)<br>
          • ✅ Claude Desktop (med HTTP transport)<br>
          • ✅ MCP Inspector (testverktyg)<br>
          • ✅ Gemini (Google AI Studio)<br>
          • ✅ Grok (xAI)<br>
          • ✅ Alla andra MCP-kompatibla klienter<br><br>
          <em>Se anslutningsguider nedan för specifika instruktioner.</em>
        </p>
      </details>
    </div>

    <!-- Anslutningsguider -->
    <div class="section">
      <h2>Anslutningsguider</h2>
      <p>Instruktioner för att ansluta servern till populära AI-tjänster:</p>

      <!-- ChatGPT -->
      <div class="guide">
        <div class="guide-title">
          <span>🤖</span> ChatGPT (OpenAI) - Developer Mode
        </div>
        <div class="guide-steps">
          <ol>
            <li>Öppna <strong>ChatGPT</strong> (kräver Pro, Plus, Business, Enterprise eller Education)</li>
            <li>Gå till <strong>Settings</strong> (⚙️)</li>
            <li>Navigera till <strong>Connectors</strong> → <strong>Advanced</strong> → <strong>Developer Mode</strong></li>
            <li>Klicka på <strong>"Add MCP Server"</strong></li>
            <li>Ange Server URL: <code>${req.protocol}://${req.get('host')}/mcp</code></li>
            <li>Välj transport: <strong>HTTP with SSE</strong></li>
            <li>Spara och aktivera connector</li>
          </ol>
          <p style="margin-top: 12px; font-style: italic; color: #d32f2f;">
            <strong>OBS:</strong> Developer Mode är "powerful but dangerous" - ChatGPT kan utföra riktiga write-operationer.
            Granska alltid verktygsanrop innan de körs.
          </p>
        </div>
      </div>

      <!-- Claude Code -->
      <div class="guide">
        <div class="guide-title">
          <span>⚡</span> Claude Code (Anthropic)
        </div>
        <div class="guide-steps">
          <p style="margin-bottom: 12px;"><strong>Metod 1: CLI (Rekommenderat)</strong></p>
          <ol>
            <li>Öppna terminalen och kör:
              <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; margin-top: 8px; overflow-x: auto; font-size: 13px;">claude mcp add --transport http skolverket ${req.protocol}://${req.get('host')}/mcp</pre>
            </li>
            <li>Starta om Claude Code</li>
            <li>Verifiera med: <code>claude mcp list</code></li>
          </ol>

          <p style="margin: 16px 0 12px;"><strong>Metod 2: Manuell konfiguration</strong></p>
          <ol>
            <li>Öppna konfigurationsfilen:
              <ul style="list-style: disc; margin-left: 20px; margin-top: 8px;">
                <li>macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                <li>Windows: <code>%APPDATA%\\Claude\\claude_desktop_config.json</code></li>
              </ul>
            </li>
            <li>Lägg till under <code>"mcpServers"</code>:
              <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; margin-top: 8px; overflow-x: auto; font-size: 13px;">"skolverket": {
  "url": "${req.protocol}://${req.get('host')}/mcp",
  "transport": "http"
}</pre>
            </li>
            <li>Starta om Claude Code</li>
          </ol>
          <p style="margin-top: 12px; font-size: 14px; color: #86868b;">
            <strong>OBS:</strong> SSE transport är deprecated, använd HTTP istället.
          </p>
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

      <!-- OpenAI Codex CLI -->
      <div class="guide">
        <div class="guide-title">
          <span>🛠️</span> OpenAI Codex CLI
        </div>
        <div class="guide-steps">
          <ol>
            <li>Installera Codex CLI (kräver Rust):
              <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; margin-top: 8px; overflow-x: auto; font-size: 13px;">curl -fsSL https://raw.githubusercontent.com/openai/codex/main/install.sh | sh</pre>
            </li>
            <li>Konfigurera MCP-servern:
              <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; margin-top: 8px; overflow-x: auto; font-size: 13px;">codex mcp add skolverket \\
  --url ${req.protocol}://${req.get('host')}/mcp \\
  --transport http</pre>
            </li>
            <li>Alternativt, redigera <code>~/.codex/config.toml</code>:
              <pre style="background: #1d1d1f; color: #f5f5f7; padding: 12px; border-radius: 6px; margin-top: 8px; overflow-x: auto; font-size: 13px;">[mcp.skolverket]
url = "${req.protocol}://${req.get('host')}/mcp"
transport = "http"</pre>
            </li>
            <li>Starta Codex: <code>codex</code></li>
            <li>Servern är nu tillgänglig i din coding agent</li>
          </ol>
          <p style="margin-top: 12px; font-style: italic;">
            Codex CLI är en lightweight coding agent som körs i terminalen och kan använda MCP-servrar för att utöka sina funktioner.
          </p>
        </div>
      </div>

      <!-- MCP Inspector -->
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
