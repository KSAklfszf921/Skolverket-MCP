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
const SSE_TIMEOUT_MS = parseInt(process.env.SSE_TIMEOUT_MS || '600000'); // 10 minutes default
const SSE_KEEPALIVE_MS = parseInt(process.env.SSE_KEEPALIVE_MS || '30000'); // 30 seconds default

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

// Root endpoint with documentation
app.get('/', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Skolverket MCP Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .header p {
      font-size: 1.2em;
      opacity: 0.95;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      color: #667eea;
      font-size: 1.8em;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    .section h3 {
      color: #764ba2;
      font-size: 1.3em;
      margin: 20px 0 10px 0;
    }
    .endpoint {
      background: #f7f7f7;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #667eea;
    }
    .endpoint code {
      background: #333;
      color: #0f0;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .endpoint .method {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.85em;
      margin-right: 10px;
    }
    .method.get { background: #10b981; color: white; }
    .method.post { background: #3b82f6; color: white; }
    .tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 10px;
      margin-top: 15px;
    }
    .tool-item {
      background: #f0f4ff;
      padding: 10px 15px;
      border-radius: 6px;
      font-size: 0.9em;
      border-left: 3px solid #667eea;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      color: white;
      font-size: 2.5em;
      margin-bottom: 5px;
    }
    .stat-card p {
      opacity: 0.9;
      font-size: 1em;
    }
    .code-block {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.5;
    }
    .code-block .keyword { color: #569cd6; }
    .code-block .string { color: #ce9178; }
    .code-block .comment { color: #6a9955; }
    a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    a:hover {
      text-decoration: underline;
    }
    .footer {
      background: #f7f7f7;
      padding: 20px 40px;
      text-align: center;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #10b981;
      color: white;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Skolverket MCP Server</h1>
      <p>Model Context Protocol Server för Skolverkets öppna API:er</p>
      <p style="margin-top: 10px;"><span class="badge">v2.1.3</span> <span class="badge" style="background: #3b82f6;">HTTP/SSE</span></p>
    </div>

    <div class="content">
      <div class="stats">
        <div class="stat-card">
          <h3>${Object.keys(tools).length}</h3>
          <p>Tillgängliga Verktyg</p>
        </div>
        <div class="stat-card">
          <h3>3</h3>
          <p>Skolverket API:er</p>
        </div>
        <div class="stat-card">
          <h3>100%</h3>
          <p>Gratis & Open Source</p>
        </div>
      </div>

      <div class="section">
        <h2>📚 Om Tjänsten</h2>
        <p>
          Denna MCP-server ger AI-assistenter tillgång till Skolverkets öppna data via Model Context Protocol.
          Servern kan användas i webbaserade chatbotar, Claude Code, och andra MCP-kompatibla klienter.
        </p>
        <p style="margin-top: 10px;">
          <strong>Funktioner:</strong> Sök i läroplaner, kurser, program, skolenheter, och vuxenutbildningar.
          Med avancerad retry-logik, caching, och strukturerad logging.
        </p>
      </div>

      <div class="section">
        <h2>🔌 API Endpoints</h2>

        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/health</code>
          <p style="margin-top: 10px;">Kontrollera serverns status och hälsa.</p>
          <a href="/health" target="_blank">Testa →</a>
        </div>

        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/tools</code>
          <p style="margin-top: 10px;">Lista alla tillgängliga MCP-verktyg (${Object.keys(tools).length} st).</p>
          <a href="/tools" target="_blank">Testa →</a>
        </div>

        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/sse</code>
          <p style="margin-top: 10px;">Server-Sent Events endpoint för real-time MCP-kommunikation.</p>
        </div>

        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/execute</code>
          <p style="margin-top: 10px;">Kör ett specifikt verktyg med givna argument.</p>
          <div class="code-block">
<span class="comment">// Exempel request:</span>
POST /execute
Content-Type: application/json

{
  <span class="string">"tool"</span>: <span class="string">"search_subjects"</span>,
  <span class="string">"arguments"</span>: {
    <span class="string">"name"</span>: <span class="string">"matematik"</span>
  }
}
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🛠️ Tillgängliga Verktyg</h2>
        <p>Servern erbjuder ${Object.keys(tools).length} verktyg uppdelade i kategorier:</p>

        <h3>📖 Läroplan & Kurser (Syllabus API)</h3>
        <div class="tool-grid">
          <div class="tool-item">search_subjects</div>
          <div class="tool-item">get_subject_details</div>
          <div class="tool-item">get_subject_versions</div>
          <div class="tool-item">search_courses</div>
          <div class="tool-item">get_course_details</div>
          <div class="tool-item">get_course_versions</div>
          <div class="tool-item">search_programs</div>
          <div class="tool-item">get_program_details</div>
          <div class="tool-item">get_program_versions</div>
          <div class="tool-item">search_curriculums</div>
          <div class="tool-item">get_curriculum_details</div>
          <div class="tool-item">get_curriculum_versions</div>
        </div>

        <h3>🏫 Skolenheter (School Units API)</h3>
        <div class="tool-grid">
          <div class="tool-item">search_school_units</div>
          <div class="tool-item">get_school_unit_details</div>
          <div class="tool-item">get_school_units_by_status</div>
          <div class="tool-item">search_school_units_by_name</div>
        </div>

        <h3>👨‍🎓 Vuxenutbildning (Planned Education API)</h3>
        <div class="tool-grid">
          <div class="tool-item">search_adult_education</div>
          <div class="tool-item">get_adult_education_details</div>
          <div class="tool-item">filter_adult_education_by_distance</div>
          <div class="tool-item">filter_adult_education_by_pace</div>
        </div>

        <h3>🔧 Support & Diagnostik</h3>
        <div class="tool-grid">
          <div class="tool-item">get_school_types</div>
          <div class="tool-item">get_types_of_syllabus</div>
          <div class="tool-item">get_subject_and_course_codes</div>
          <div class="tool-item">get_study_path_codes</div>
          <div class="tool-item">get_api_info</div>
          <div class="tool-item">get_education_areas</div>
          <div class="tool-item">get_directions</div>
          <div class="tool-item">health_check</div>
        </div>
      </div>

      <div class="section">
        <h2>🚀 Kom Igång</h2>

        <h3>Använd i Claude Code</h3>
        <div class="code-block">
<span class="comment"># Lägg till MCP-server i Claude Code:</span>
claude mcp add --transport http skolverket \\
  https://skolverket-mcp.onrender.com/sse
        </div>

        <h3>Använd i Webbaserad Chatbot</h3>
        <div class="code-block">
{
  <span class="string">"mcpServers"</span>: [
    {
      <span class="string">"name"</span>: <span class="string">"skolverket"</span>,
      <span class="string">"url"</span>: <span class="string">"https://skolverket-mcp.onrender.com"</span>,
      <span class="string">"transport"</span>: <span class="string">"http"</span>,
      <span class="string">"endpoints"</span>: {
        <span class="string">"tools"</span>: <span class="string">"/tools"</span>,
        <span class="string">"execute"</span>: <span class="string">"/execute"</span>,
        <span class="string">"health"</span>: <span class="string">"/health"</span>
      }
    }
  ]
}
        </div>

        <h3>Curl Exempel</h3>
        <div class="code-block">
<span class="comment"># Sök efter ämnen:</span>
curl -X POST https://skolverket-mcp.onrender.com/execute \\
  -H <span class="string">"Content-Type: application/json"</span> \\
  -d <span class="string">'{
    "tool": "search_subjects",
    "arguments": {
      "name": "matematik"
    }
  }'</span>
        </div>
      </div>

      <div class="section">
        <h2>📖 Resurser</h2>
        <p>
          <a href="https://github.com/KSAklfszf921/skolverket-mcp" target="_blank">📦 GitHub Repository</a> •
          <a href="https://api.skolverket.se" target="_blank">🔗 Skolverkets API</a> •
          <a href="https://modelcontextprotocol.io" target="_blank">📚 MCP Dokumentation</a>
        </p>
      </div>
    </div>

    <div class="footer">
      <p>
        Skolverket MCP Server v2.1.3 • Byggd med Node.js, TypeScript, Express & MCP SDK
      </p>
      <p style="margin-top: 5px; font-size: 0.9em;">
        Deployad på Render • ${new Date().getFullYear()} • Open Source MIT License
      </p>
    </div>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const requestId = uuidv4();
  const reqLog = createRequestLogger(requestId);

  reqLog.info('Health check requested');

  res.json({
    status: 'healthy',
    service: 'skolverket-mcp',
    version: '2.1.3',
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
    version: '2.1.3',
  })}\n\n`);

  // Keepalive ping
  const keepalive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, SSE_KEEPALIVE_MS);

  // Connection timeout
  const connectionTimeout = setTimeout(() => {
    reqLog.info('SSE connection timeout', { timeoutMs: SSE_TIMEOUT_MS });
    clearInterval(keepalive);
    res.end();
  }, SSE_TIMEOUT_MS);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(keepalive);
    clearTimeout(connectionTimeout);
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
