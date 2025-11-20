/**
 * Input sanitization utilities för säkerhet
 */

/**
 * Sanitize string input - tar bort potentiellt farliga tecken
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trimma och begränsa längd
  let sanitized = input.trim().substring(0, maxLength);

  // Ta bort null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Ta bort control characters utom vanliga whitespace
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Sanitize URL parameters - förhindra injection
 */
export function sanitizeUrlParam(param: string): string {
  if (!param || typeof param !== 'string') {
    return '';
  }

  // Tillåt endast alfanumeriska, dash, underscore
  return param.replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Sanitize code (kurs/ämne/program-koder)
 */
export function sanitizeCode(code: string): string {
  if (!code || typeof code !== 'string') {
    return '';
  }

  // Skolverkets koder är alfanumeriska med enstaka specialtecken
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Validera och sanitize nummer
 */
export function sanitizeNumber(value: any, min?: number, max?: number): number | null {
  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * Sanitize boolean
 */
export function sanitizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }

  return Boolean(value);
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 200): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Trimma, begränsa längd
  let sanitized = query.trim().substring(0, maxLength);

  // Ta bort HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Ta bort SQL injection patterns
  sanitized = sanitized.replace(/['";\\]/g, '');

  // Ta bort script-relaterade ord
  sanitized = sanitized.replace(/\b(script|javascript|eval|function|on\w+)\b/gi, '');

  return sanitized;
}

/**
 * Escape HTML för att förhindra XSS
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') {
    return '';
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validera att en sträng inte innehåller path traversal
 */
export function isPathTraversalSafe(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Kolla efter path traversal patterns
  const dangerousPatterns = [
    /\.\./,
    /\\/,
    /\/\//,
    /%2e%2e/i,
    /%2f/i,
    /%5c/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}
