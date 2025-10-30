/**
 * Custom error classes för Skolverket MCP Server
 */

/**
 * Base error för alla Skolverket-relaterade fel
 */
export class SkolverketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SkolverketError';
  }
}

/**
 * Fel från Skolverkets API
 */
export class SkolverketApiError extends SkolverketError {
  constructor(
    message: string,
    public statusCode?: number,
    public apiResponse?: any,
    public code?: string,
    public url?: string,
    public attempts?: number,
    public timestamp?: string
  ) {
    super(message);
    this.name = 'SkolverketApiError';
  }
}

/**
 * Autentiseringsfel - API-nyckel saknas eller ogiltig
 */
export class AuthenticationError extends SkolverketApiError {
  constructor(message: string = 'API key missing or invalid', url?: string) {
    super(message, 401, undefined, 'AUTH_REQUIRED', url, 1, new Date().toISOString());
    this.name = 'AuthenticationError';
  }
}

/**
 * Tillfälligt fel som kan lösas med retry
 */
export class TransientError extends SkolverketApiError {
  constructor(message: string, statusCode?: number, url?: string) {
    super(message, statusCode, undefined, 'TRANSIENT_ERROR', url, 1, new Date().toISOString());
    this.name = 'TransientError';
  }
}

/**
 * Valideringsfel för tool-parametrar
 */
export class ValidationError extends SkolverketError {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Fel vid resource-åtkomst
 */
export class ResourceNotFoundError extends SkolverketError {
  constructor(
    public uri: string,
    message?: string
  ) {
    super(message || `Resource inte hittad: ${uri}`);
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * Cache-relaterade fel
 */
export class CacheError extends SkolverketError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

/**
 * Rate limiting-fel
 */
export class RateLimitError extends SkolverketError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}
