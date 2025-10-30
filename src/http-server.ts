#!/usr/bin/env node

/**
 * Skolverket MCP Server - HTTP/SSE Transport
 *
 * Denna server exponerar skolverket-mcp via HTTP med Server-Sent Events
 * så att den kan användas från webbaserade AI-chatbotar.
 *
 * Starta servern:
 *   npm run start:http
 *
 * Använd från MCP-klient:
 *   URL: http://localhost:3000/sse
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { log, createRequestLogger } from './logger.js';

// Importera alla verktyg
import { searchSubjects, getSubjectDetails, getSubjectVersions } from './tools/syllabus/subjects.js';
import { searchCourses, getCourseDetails, getCourseVersions } from './tools/syllabus/courses.js';
import { searchPrograms, getProgramDetails, getProgramVersions } from './tools/syllabus/programs.js';
import { searchCurriculums, getCurriculumDetails, getCurriculumVersions } from './tools/syllabus/curriculums.js';
import { getSchoolTypes, getTypesOfSyllabus, getSubjectAndCourseCodes, getStudyPathCodes, getApiInfo } from './tools/syllabus/valuestore.js';
import { searchSchoolUnits, getSchoolUnitDetails, getSchoolUnitsByStatus, searchSchoolUnitsByName } from './tools/school-units/search.js';
import { searchAdultEducation, getAdultEducationDetails, filterAdultEducationByDistance, filterAdultEducationByPace } from './tools/planned-education/adult-education.js';
import { getEducationAreas, getDirections } from './tools/planned-education/support-data.js';
import { healthCheck } from './tools/health.js';

const PORT = process.env.PORT || 3000;
const ENABLE_CORS = process.env.ENABLE_CORS !== 'false';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

if (ENABLE_CORS) {
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }));
}

// Tool registry
const tools: Record<string, (args: any) => Promise<any>> = {
  // Syllabus API
  search_subjects: searchSubjects,
  get_subject_details: getSubjectDetails,
  get_subject_versions: getSubjectVersions,
  search_courses: searchCourses,
  get_course_details: getCourseDetails,
  get_course_versions: getCourseVersions,
  search_programs: searchPrograms,
  get_program_details: getProgramDetails,
  get_program_versions: getProgramVersions,
  search_curriculums: searchCurriculums,
  get_curriculum_details: getCurriculumDetails,
  get_curriculum_versions: getCurriculumVersions,
  get_school_types: getSchoolTypes,
  get_types_of_syllabus: getTypesOfSyllabus,
  get_subject_and_course_codes: getSubjectAndCourseCodes,
  get_study_path_codes: getStudyPathCodes,
  get_api_info: getApiInfo,

  // School Units API
  search_school_units: searchSchoolUnits,
  get_school_unit_details: getSchoolUnitDetails,
  get_school_units_by_status: getSchoolUnitsByStatus,
  search_school_units_by_name: searchSchoolUnitsByName,

  // Planned Education API
  search_adult_education: searchAdultEducation,
  get_adult_education_details: getAdultEducationDetails,
  filter_adult_education_by_distance: filterAdultEducationByDistance,
  filter_adult_education_by_pace: filterAdultEducationByPace,
  get_education_areas: getEducationAreas,
  get_directions: getDirections,

  // Diagnostics
  health_check: healthCheck,
};

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const requestId = uuidv4();
  const reqLog = createRequestLogger(requestId);

  reqLog.info('Health check requested');

  res.json({
    status: 'healthy',
    service: 'skolverket-mcp',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    transport: 'http-sse',
    endpoints: {
      health: '/health',
      sse: '/sse',
      tools: '/tools',
    },
    toolCount: Object.keys(tools).length,
  });
});

// List tools endpoint
app.get('/tools', (req: Request, res: Response) => {
  const requestId = uuidv4();
  const reqLog = createRequestLogger(requestId);

  reqLog.info('Tools list requested');

  const toolList = Object.keys(tools).map(name => ({
    name,
    description: `Skolverket MCP tool: ${name}`,
  }));

  res.json({
    tools: toolList,
    count: toolList.length,
  });
});

// SSE endpoint for MCP communication
app.get('/sse', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const reqLog = createRequestLogger(requestId);

  reqLog.info('SSE connection established');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial connection message
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    requestId,
    timestamp: new Date().toISOString(),
    service: 'skolverket-mcp',
    version: '2.1.0',
  })}\n\n`);

  // Keepalive ping every 30 seconds
  const keepalive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(keepalive);
    reqLog.info('SSE connection closed');
  });
});

// Execute tool endpoint
app.post('/execute', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const reqLog = createRequestLogger(requestId);

  try {
    const { tool, arguments: args } = req.body;

    if (!tool) {
      return res.status(400).json({
        error: 'Missing required parameter: tool',
        requestId,
      });
    }

    reqLog.info('Tool execution requested', { tool, args });

    const toolFunction = tools[tool];

    if (!toolFunction) {
      return res.status(404).json({
        error: `Unknown tool: ${tool}`,
        availableTools: Object.keys(tools),
        requestId,
      });
    }

    // Execute tool
    const result = await toolFunction(args || {});

    reqLog.info('Tool execution completed', { tool });

    res.json({
      success: true,
      tool,
      result,
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    const reqLog = createRequestLogger(requestId);
    reqLog.error('Tool execution failed', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: any) => {
  log.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: ['/health', '/tools', '/sse', '/execute'],
  });
});

// Start server
app.listen(PORT, () => {
  log.info(`Skolverket MCP Server (HTTP/SSE) started`, {
    port: PORT,
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      tools: `http://localhost:${PORT}/tools`,
      sse: `http://localhost:${PORT}/sse`,
      execute: `http://localhost:${PORT}/execute`,
    },
    cors: ENABLE_CORS,
    environment: process.env.NODE_ENV || 'development',
  });

  console.error(`\n✅ Skolverket MCP Server (HTTP/SSE) is running!`);
  console.error(`📍 Health check: http://localhost:${PORT}/health`);
  console.error(`🛠️  Tools list: http://localhost:${PORT}/tools`);
  console.error(`📡 SSE endpoint: http://localhost:${PORT}/sse`);
  console.error(`⚡ Execute tool: POST http://localhost:${PORT}/execute`);
  console.error(`\nFor use with AI chatbots, provide the base URL: http://localhost:${PORT}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
