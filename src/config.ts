/**
 * Centraliserad konfiguration för Skolverket MCP Server
 * Läser från miljövariabler med sane defaults
 */

export interface SkolverketConfig {
  // API URLs
  syllabusApiBaseUrl: string;
  schoolUnitsApiBaseUrl: string;
  plannedEducationApiBaseUrl: string;

  // Authentication
  apiKey?: string;
  authHeader?: string;

  // HTTP Client
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  maxConcurrent: number;

  // Features
  enableMockMode: boolean;
  enableCache: boolean;

  // Logging
  logLevel: string;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Läs konfiguration från miljövariabler
 */
export function loadConfig(): SkolverketConfig {
  return {
    // API URLs - kan överridas för testning
    syllabusApiBaseUrl: process.env.SKOLVERKET_SYLLABUS_API_URL || 'https://api.skolverket.se/syllabus',
    // Skolenhetsregistret är ett separat API med egen base URL (v2 active sedan 2024-12-13)
    schoolUnitsApiBaseUrl: process.env.SKOLVERKET_SCHOOL_UNITS_API_URL || 'https://api.skolverket.se/skolenhetsregistret',
    plannedEducationApiBaseUrl: process.env.SKOLVERKET_PLANNED_EDUCATION_API_URL || 'https://api.skolverket.se/planned-educations',

    // Authentication
    apiKey: process.env.SKOLVERKET_API_KEY,
    authHeader: process.env.SKOLVERKET_AUTH_HEADER || 'Authorization',

    // HTTP Client
    timeout: parseNumber(process.env.SKOLVERKET_API_TIMEOUT_MS, 30000),
    maxRetries: parseNumber(process.env.SKOLVERKET_MAX_RETRIES, 3),
    retryDelay: parseNumber(process.env.SKOLVERKET_RETRY_DELAY_MS, 1000),
    maxConcurrent: parseNumber(process.env.SKOLVERKET_CONCURRENCY, 5),

    // Features
    enableMockMode: parseBoolean(process.env.SKOLVERKET_ENABLE_MOCK, false),
    enableCache: parseBoolean(process.env.SKOLVERKET_ENABLE_CACHE, true),

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

// Export singleton config instance
export const config = loadConfig();

// Log konfiguration vid start (utan känslig info)
import { log } from './logger.js';

log.info('Skolverket MCP Configuration loaded', {
  syllabusApiBaseUrl: config.syllabusApiBaseUrl,
  schoolUnitsApiBaseUrl: config.schoolUnitsApiBaseUrl,
  plannedEducationApiBaseUrl: config.plannedEducationApiBaseUrl,
  hasApiKey: !!config.apiKey,
  timeout: config.timeout,
  maxRetries: config.maxRetries,
  maxConcurrent: config.maxConcurrent,
  enableMockMode: config.enableMockMode,
  enableCache: config.enableCache,
  logLevel: config.logLevel,
});

// Varna om mock mode är aktiverat
if (config.enableMockMode) {
  log.warn('⚠️  Mock mode is ENABLED - using fixtures instead of real API calls');
}

// Varna om API-nyckel saknas (om Skolverket skulle kräva det)
if (!config.apiKey && process.env.SKOLVERKET_REQUIRE_API_KEY === 'true') {
  log.warn('⚠️  API key is not configured but may be required');
}
