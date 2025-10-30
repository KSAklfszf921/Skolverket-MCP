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
    public apiResponse?: any
  ) {
    super(message);
    this.name = 'SkolverketApiError';
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
