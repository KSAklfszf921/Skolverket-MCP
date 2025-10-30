#!/usr/bin/env node

/**
 * Skolverket Syllabus MCP Server
 *
 * MCP server för att ge LLMs tillgång till Skolverkets Läroplan API.
 * Innehåller verktyg för att söka och hämta information om läroplaner,
 * ämnen, kurser och program.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Importera alla verktyg
import {
  searchSubjects,
  getSubjectDetails,
  getSubjectVersions,
  searchSubjectsSchema,
  getSubjectDetailsSchema,
  getSubjectVersionsSchema
} from './tools/subjects.js';

import {
  searchCourses,
  getCourseDetails,
  getCourseVersions,
  searchCoursesSchema,
  getCourseDetailsSchema,
  getCourseVersionsSchema
} from './tools/courses.js';

import {
  searchPrograms,
  getProgramDetails,
  getProgramVersions,
  searchProgramsSchema,
  getProgramDetailsSchema,
  getProgramVersionsSchema
} from './tools/programs.js';

import {
  searchCurriculums,
  getCurriculumDetails,
  getCurriculumVersions,
  searchCurriculumsSchema,
  getCurriculumDetailsSchema,
  getCurriculumVersionsSchema
} from './tools/curriculums.js';

import {
  getSchoolTypes,
  getTypesOfSyllabus,
  getSubjectAndCourseCodes,
  getStudyPathCodes,
  getApiInfo,
  getSchoolTypesSchema,
  getStudyPathCodesSchema
} from './tools/valuestore.js';

// Skapa servern
const server = new Server(
  {
    name: 'skolverket-syllabus-mcp',
    version: '1.0.0',
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
        description: 'Hämta information om Skolverkets API, inklusive version och kontaktuppgifter.',
        inputSchema: {
          type: 'object',
          properties: {},
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
      // Ämnesverktyg
      case 'search_subjects':
        return await searchSubjects(args as any);
      case 'get_subject_details':
        return await getSubjectDetails(args as any);
      case 'get_subject_versions':
        return await getSubjectVersions(args as any);

      // Kursverktyg
      case 'search_courses':
        return await searchCourses(args as any);
      case 'get_course_details':
        return await getCourseDetails(args as any);
      case 'get_course_versions':
        return await getCourseVersions(args as any);

      // Programverktyg
      case 'search_programs':
        return await searchPrograms(args as any);
      case 'get_program_details':
        return await getProgramDetails(args as any);
      case 'get_program_versions':
        return await getProgramVersions(args as any);

      // Läroplansverktyg
      case 'search_curriculums':
        return await searchCurriculums(args as any);
      case 'get_curriculum_details':
        return await getCurriculumDetails(args as any);
      case 'get_curriculum_versions':
        return await getCurriculumVersions(args as any);

      // Värdesamlingsverktyg
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
  console.error('Skolverket Syllabus MCP Server startad');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
