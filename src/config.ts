/**
 * Centraliserad konfiguration för Skolverket MCP Server
 * Läser från miljövariabler med sane defaults
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { HTTP_DEFAULTS } from './constants.js';

// Ladda .env-fil om den finns
dotenvConfig();

/**
 * Zod schema för config validation
 */
const ConfigSchema = z.object({
  syllabusApiBaseUrl: z.string().url(),
  schoolUnitsApiBaseUrl: z.string().url(),
  plannedEducationApiBaseUrl: z.string().url(),
  apiKey: z.string().optional(),
  authHeader: z.string().optional(),
  timeout: z.number().min(1000).max(120000),
  maxRetries: z.number().min(0).max(10),
  retryDelay: z.number().min(100).max(10000),
  maxConcurrent: z.number().min(1).max(50),
  enableMockMode: z.boolean(),
  enableCache: z.boolean(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
});

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
 * Läs konfiguration från miljövariabler med validering
 */
export function loadConfig(): SkolverketConfig {
  const rawConfig = {
    // API URLs - kan överridas för testning
    syllabusApiBaseUrl: process.env.SKOLVERKET_SYLLABUS_API_URL || 'https://api.skolverket.se/syllabus',
    // Skolenhetsregistret är ett separat API med egen base URL (v2 active sedan 2024-12-13)
    schoolUnitsApiBaseUrl: process.env.SKOLVERKET_SCHOOL_UNITS_API_URL || 'https://api.skolverket.se/skolenhetsregistret',
    plannedEducationApiBaseUrl: process.env.SKOLVERKET_PLANNED_EDUCATION_API_URL || 'https://api.skolverket.se/planned-educations',

    // Authentication
    apiKey: process.env.SKOLVERKET_API_KEY,
    authHeader: process.env.SKOLVERKET_AUTH_HEADER || 'Authorization',

    // HTTP Client
    timeout: parseNumber(process.env.SKOLVERKET_API_TIMEOUT_MS, HTTP_DEFAULTS.TIMEOUT_MS),
    maxRetries: parseNumber(process.env.SKOLVERKET_MAX_RETRIES, HTTP_DEFAULTS.MAX_RETRIES),
    retryDelay: parseNumber(process.env.SKOLVERKET_RETRY_DELAY_MS, HTTP_DEFAULTS.RETRY_DELAY_MS),
    maxConcurrent: parseNumber(process.env.SKOLVERKET_CONCURRENCY, HTTP_DEFAULTS.MAX_CONCURRENT),

    // Features
    enableMockMode: parseBoolean(process.env.SKOLVERKET_ENABLE_MOCK, false),
    enableCache: parseBoolean(process.env.SKOLVERKET_ENABLE_CACHE, true),

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
  };

  // Validera konfiguration
  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid configuration: ${errors}`);
    }
    throw error;
  }
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
