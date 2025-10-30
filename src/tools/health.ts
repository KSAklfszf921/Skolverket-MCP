/**
 * Health check verktyg för att testa API-anslutningar
 */

import { z } from 'zod';
import { syllabusApi } from '../api/syllabus-client.js';
import { schoolUnitsApi } from '../api/school-units-client.js';
import { plannedEducationApi } from '../api/planned-education-client.js';
import { config } from '../config.js';
import { log } from '../logger.js';

export const healthCheckSchema = z.object({
  includeApiTests: z.boolean().optional().describe('Test actual API endpoints (default: true)'),
});

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  error?: string;
  url?: string;
}

export interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  config: {
    mockMode: boolean;
    cacheEnabled: boolean;
    maxRetries: number;
    timeout: number;
  };
  services: HealthStatus[];
  recommendations?: string[];
}

/**
 * Kör health check på alla services
 */
export async function healthCheck(args: z.infer<typeof healthCheckSchema>) {
  const includeApiTests = args.includeApiTests ?? true;
  const results: HealthStatus[] = [];
  const recommendations: string[] = [];

  log.info('Running health check', { includeApiTests });

  // Check config
  results.push({
    service: 'Configuration',
    status: 'healthy',
    url: undefined,
  });

  if (config.enableMockMode) {
    recommendations.push('Mock mode is enabled - switch to real API calls for production');
  }

  if (!config.enableCache) {
    recommendations.push('Cache is disabled - enabling it will improve performance');
  }

  // Test API endpoints if requested
  if (includeApiTests) {
    // Test Syllabus API
    try {
      const startTime = Date.now();
      await syllabusApi.getApiInfo();
      const latency = Date.now() - startTime;

      results.push({
        service: 'Syllabus API',
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
        url: config.syllabusApiBaseUrl,
      });

      if (latency > 2000) {
        recommendations.push('Syllabus API response time is slow (>2s)');
      }
    } catch (error: any) {
      results.push({
        service: 'Syllabus API',
        status: 'unhealthy',
        error: error.message,
        url: config.syllabusApiBaseUrl,
      });

      if (error.name === 'AuthenticationError') {
        recommendations.push('Authentication failed - check if API key is required');
      } else if (error.name === 'TransientError') {
        recommendations.push('Temporary error - API may be experiencing issues');
      } else {
        recommendations.push('Cannot reach Syllabus API - check network and URL');
      }
    }

    // Test School Units API
    try {
      const startTime = Date.now();
      // Försök hämta en liten mängd data
      await schoolUnitsApi.getAllSchoolUnits();
      const latency = Date.now() - startTime;

      results.push({
        service: 'School Units API',
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
        url: config.schoolUnitsApiBaseUrl,
      });

      if (latency > 2000) {
        recommendations.push('School Units API response time is slow (>2s)');
      }
    } catch (error: any) {
      results.push({
        service: 'School Units API',
        status: 'unhealthy',
        error: error.message,
        url: config.schoolUnitsApiBaseUrl,
      });

      if (error.name === 'AuthenticationError') {
        recommendations.push('Authentication failed for School Units API');
      } else {
        recommendations.push('Cannot reach School Units API - check network and URL');
      }
    }

    // Test Planned Education API
    try {
      const startTime = Date.now();
      await plannedEducationApi.getEducationAreas();
      const latency = Date.now() - startTime;

      results.push({
        service: 'Planned Education API',
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
        url: config.plannedEducationApiBaseUrl,
      });

      if (latency > 2000) {
        recommendations.push('Planned Education API response time is slow (>2s)');
      }
    } catch (error: any) {
      results.push({
        service: 'Planned Education API',
        status: 'unhealthy',
        error: error.message,
        url: config.plannedEducationApiBaseUrl,
      });

      if (error.name === 'AuthenticationError') {
        recommendations.push('Authentication failed for Planned Education API');
      } else {
        recommendations.push('Cannot reach Planned Education API - check network and URL');
      }
    }
  }

  // Determine overall status
  const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
  const degradedCount = results.filter(r => r.status === 'degraded').length;

  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount > 0) {
    overall = 'unhealthy';
  } else if (degradedCount > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }

  const result: HealthCheckResult = {
    overall,
    timestamp: new Date().toISOString(),
    config: {
      mockMode: config.enableMockMode,
      cacheEnabled: config.enableCache,
      maxRetries: config.maxRetries,
      timeout: config.timeout,
    },
    services: results,
  };

  if (recommendations.length > 0) {
    result.recommendations = recommendations;
  }

  log.info('Health check completed', { overall, unhealthyCount, degradedCount });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
