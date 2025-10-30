#!/usr/bin/env node

/**
 * Skolverket MCP Server
 *
 * Komplett MCP server för att ge LLMs tillgång till Skolverkets öppna API:er:
 * - Läroplan API (läroplaner, ämnen, kurser, program)
 * - Skolenhetsregistret API (skolenheter och deras status)
 * - Planned Educations API (utbildningstillfällen, statistik, inspektionsrapporter)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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

// Skapa servern
const server = new Server(
  {
    name: 'skolverket-mcp',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Lista alla tillgängliga verktyg
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ==============================================
      // LÄROPLAN API VERKTYG (Syllabus API)
      // ==============================================

      // Ämnesverktyg
      {
        name: 'search_subjects',
        description: 'Sök efter ämnen i Skolverkets läroplan. Kan filtreras på skoltyp, tidsperiod och typ av läroplan.',
        inputSchema: {
          type: 'object',
          properties: searchSubjectsSchema,
        },
      },
      {
        name: 'get_subject_details',
        description: 'Hämta detaljerad information om ett specifikt ämne, inklusive kurser, centralt innehåll och kunskapskrav.',
        inputSchema: {
          type: 'object',
          properties: getSubjectDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_subject_versions',
        description: 'Hämta alla tillgängliga versioner av ett ämne för att se historiska ändringar.',
        inputSchema: {
          type: 'object',
          properties: getSubjectVersionsSchema,
          required: ['code'],
        },
      },

      // Kursverktyg
      {
        name: 'search_courses',
        description: 'Sök efter kurser i Skolverkets läroplan. Kan filtreras på skoltyp, ämne, tidsperiod och typ av läroplan.',
        inputSchema: {
          type: 'object',
          properties: searchCoursesSchema,
        },
      },
      {
        name: 'get_course_details',
        description: 'Hämta detaljerad information om en specifik kurs, inklusive poäng, centralt innehåll och kunskapskrav.',
        inputSchema: {
          type: 'object',
          properties: getCourseDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_course_versions',
        description: 'Hämta alla tillgängliga versioner av en kurs för att se historiska ändringar.',
        inputSchema: {
          type: 'object',
          properties: getCourseVersionsSchema,
          required: ['code'],
        },
      },

      // Programverktyg
      {
        name: 'search_programs',
        description: 'Sök efter gymnasieprogram och andra studievägar. Kan filtreras på skoltyp, tidsperiod och studievägstyp.',
        inputSchema: {
          type: 'object',
          properties: searchProgramsSchema,
        },
      },
      {
        name: 'get_program_details',
        description: 'Hämta detaljerad information om ett specifikt program, inklusive inriktningar, profiler och yrkesutfall.',
        inputSchema: {
          type: 'object',
          properties: getProgramDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_program_versions',
        description: 'Hämta alla tillgängliga versioner av ett program för att se historiska ändringar.',
        inputSchema: {
          type: 'object',
          properties: getProgramVersionsSchema,
          required: ['code'],
        },
      },

      // Läroplansverktyg
      {
        name: 'search_curriculums',
        description: 'Sök efter läroplaner (t.ex. LGR11, GY11). Kan filtreras på skoltyp, tidsperiod och typ av läroplan.',
        inputSchema: {
          type: 'object',
          properties: searchCurriculumsSchema,
        },
      },
      {
        name: 'get_curriculum_details',
        description: 'Hämta detaljerad information om en specifik läroplan, inklusive alla avsnitt och innehåll.',
        inputSchema: {
          type: 'object',
          properties: getCurriculumDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_curriculum_versions',
        description: 'Hämta alla tillgängliga versioner av en läroplan för att se historiska ändringar.',
        inputSchema: {
          type: 'object',
          properties: getCurriculumVersionsSchema,
          required: ['code'],
        },
      },

      // Värdesamlingsverktyg
      {
        name: 'get_school_types',
        description: 'Hämta lista över alla tillgängliga skoltyper (t.ex. GR för grundskola, GY för gymnasium).',
        inputSchema: {
          type: 'object',
          properties: getSchoolTypesSchema,
        },
      },
      {
        name: 'get_types_of_syllabus',
        description: 'Hämta lista över alla typer av läroplaner.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_subject_and_course_codes',
        description: 'Hämta lista över alla tillgängliga ämnes- och kurskoder.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_study_path_codes',
        description: 'Hämta lista över studievägskodar (programkoder). Kan filtreras på skoltyp, tidsperiod och studievägstyp.',
        inputSchema: {
          type: 'object',
          properties: getStudyPathCodesSchema,
        },
      },
      {
        name: 'get_api_info',
        description: 'Hämta information om Skolverkets Läroplan API, inklusive version och kontaktuppgifter.',
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
        description: 'Sök efter skolenheter (skolor, förskolor, etc.) med filter för namn och status.',
        inputSchema: {
          type: 'object',
          properties: searchSchoolUnitsSchema,
        },
      },
      {
        name: 'get_school_unit_details',
        description: 'Hämta detaljer om en specifik skolenhet baserat på skolenhetskod.',
        inputSchema: {
          type: 'object',
          properties: getSchoolUnitDetailsSchema,
          required: ['code'],
        },
      },
      {
        name: 'get_school_units_by_status',
        description: 'Hämta skolenheter filtrerade på status (AKTIV, UPPHORT, VILANDE).',
        inputSchema: {
          type: 'object',
          properties: getSchoolUnitsByStatusSchema,
          required: ['status'],
        },
      },
      {
        name: 'search_school_units_by_name',
        description: 'Sök efter skolenheter baserat på namn (delmatchning).',
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
        description: 'Sök efter vuxenutbildningar (YH, SFI, Komvux, etc.) med omfattande filtreringsmöjligheter.',
        inputSchema: {
          type: 'object',
          properties: searchAdultEducationSchema,
        },
      },
      {
        name: 'get_adult_education_details',
        description: 'Hämta detaljerad information om ett specifikt vuxenutbildningstillfälle.',
        inputSchema: {
          type: 'object',
          properties: getAdultEducationDetailsSchema,
          required: ['id'],
        },
      },
      {
        name: 'filter_adult_education_by_distance',
        description: 'Filtrera vuxenutbildningar på om de är distansutbildningar eller campus-utbildningar.',
        inputSchema: {
          type: 'object',
          properties: filterAdultEducationByDistanceSchema,
          required: ['distance'],
        },
      },
      {
        name: 'filter_adult_education_by_pace',
        description: 'Filtrera vuxenutbildningar efter studietakt (heltid, halvtid, etc.).',
        inputSchema: {
          type: 'object',
          properties: filterAdultEducationByPaceSchema,
          required: ['paceOfStudy'],
        },
      },

      // Stöddata
      {
        name: 'get_education_areas',
        description: 'Hämta alla tillgängliga utbildningsområden för vuxenutbildningar.',
        inputSchema: {
          type: 'object',
          properties: getEducationAreasSchema,
        },
      },
      {
        name: 'get_directions',
        description: 'Hämta alla tillgängliga inriktningar för vuxenutbildningar.',
        inputSchema: {
          type: 'object',
          properties: getDirectionsSchema,
        },
      },
    ],
  };
});

// Hantera verktygsanrop
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

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

      default:
        throw new Error(`Okänt verktyg: ${name}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
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

// Starta servern
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Logga till stderr (INTE stdout!)
  console.error('Skolverket MCP Server v2.0.0 startad');
  console.error('Inkluderar: Läroplan API, Skolenhetsregistret API, Planned Educations API');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
