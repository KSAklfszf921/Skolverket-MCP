/**
 * Validation utilities for MCP tool parameters
 * Provides helpful error messages and format validation
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate skolenhetskod (school unit code)
 * Must be exactly 8 digits
 */
export function validateSkolenhetskod(code: string): ValidationResult {
  if (!code) {
    return {
      valid: false,
      error: 'Skolenhetskod saknas. En giltig skolenhetskod består av 8 siffror (t.ex. "29824923").'
    };
  }

  const codeStr = code.toString().trim();

  if (!/^\d{8}$/.test(codeStr)) {
    return {
      valid: false,
      error: `Ogiltig skolenhetskod "${code}". En skolenhetskod måste vara exakt 8 siffror (t.ex. "29824923" eller "10015408"). Du angav: "${code}".`
    };
  }

  return { valid: true };
}

/**
 * Validate school year format
 * Must be in format YYYY/YYYY where second year is first year + 1
 */
export function validateSchoolYear(schoolYear: string): ValidationResult {
  if (!schoolYear) {
    return { valid: true }; // Optional parameter
  }

  const yearPattern = /^(\d{4})\/(\d{4})$/;
  const match = schoolYear.match(yearPattern);

  if (!match) {
    return {
      valid: false,
      error: `Ogiltigt läsårsformat "${schoolYear}". Använd formatet YYYY/YYYY (t.ex. "2023/2024"). Du angav: "${schoolYear}".`
    };
  }

  const startYear = parseInt(match[1]);
  const endYear = parseInt(match[2]);

  if (endYear !== startYear + 1) {
    return {
      valid: false,
      error: `Ogiltigt läsår "${schoolYear}". Det andra året måste vara exakt ett år efter det första (t.ex. "2023/2024", inte "${schoolYear}").`
    };
  }

  return { valid: true };
}

/**
 * Validate school type
 */
const VALID_SCHOOL_TYPES = [
  'fsk', 'FSK',
  'gr', 'GR',
  'gran', 'GRAN',
  'gy', 'GY',
  'gyan', 'GYAN',
  'Förskola',
  'Grundskola',
  'Grundsärskola',
  'Gymnasieskola',
  'Gymnasiesärskola',
  'Komvux',
  'KOMVUX',
  'YH',
  'SFI'
];

export function validateSchoolType(schoolType: string): ValidationResult {
  if (!schoolType) {
    return { valid: true }; // Optional parameter
  }

  if (!VALID_SCHOOL_TYPES.includes(schoolType)) {
    return {
      valid: false,
      error: `Ogiltig skoltyp "${schoolType}". Giltiga värden: FSK (förskola), GR (grundskola), GRAN (grundsärskola), GY (gymnasium), GYAN (gymnasiesärskola), KOMVUX, YH, SFI. Du angav: "${schoolType}".`
    };
  }

  return { valid: true };
}

/**
 * Validate survey year format
 * Must be a 4-digit year (YYYY)
 */
export function validateSurveyYear(surveyYear: string): ValidationResult {
  if (!surveyYear) {
    return { valid: true }; // Optional parameter
  }

  if (!/^\d{4}$/.test(surveyYear)) {
    return {
      valid: false,
      error: `Ogiltigt enkätår "${surveyYear}". Använd formatet YYYY med 4 siffror (t.ex. "2023"). Du angav: "${surveyYear}".`
    };
  }

  const year = parseInt(surveyYear);
  if (year < 2000 || year > 2100) {
    return {
      valid: false,
      error: `Enkåtåret "${surveyYear}" ligger utanför rimligt intervall (2000-2100).`
    };
  }

  return { valid: true };
}

/**
 * Validate status parameter
 */
const VALID_STATUSES = ['AKTIV', 'UPPHORT', 'UPPHÖRD', 'VILANDE'];

export function validateStatus(status: string): ValidationResult {
  if (!status) {
    return { valid: true }; // Optional parameter
  }

  const upperStatus = status.toUpperCase();
  if (!VALID_STATUSES.includes(upperStatus)) {
    return {
      valid: false,
      error: `Ogiltig status "${status}". Giltiga värden: AKTIV, UPPHÖRD (nedlagd), VILANDE. Du angav: "${status}".`
    };
  }

  return { valid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, size?: number): ValidationResult {
  if (page !== undefined && page < 0) {
    return {
      valid: false,
      error: `Ogiltigt sidnummer "${page}". Sidnummer måste vara 0 eller högre (0-indexerat).`
    };
  }

  if (size !== undefined) {
    if (size < 1) {
      return {
        valid: false,
        error: `Ogiltig sidstorlek "${size}". Sidstorlek måste vara minst 1.`
      };
    }
    if (size > 100) {
      return {
        valid: false,
        error: `Sidstorlek "${size}" är för stor. Maximum är 100 resultat per sida. Använd paginering för att hämta fler resultat.`
      };
    }
  }

  return { valid: true };
}

/**
 * Validate GPS coordinates
 */
export function validateCoordinates(latitude: number, longitude: number): ValidationResult {
  if (latitude < -90 || latitude > 90) {
    return {
      valid: false,
      error: `Ogiltig latitud "${latitude}". Latitud måste vara mellan -90 och 90 grader.`
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: `Ogiltig longitud "${longitude}". Longitud måste vara mellan -180 och 180 grader.`
    };
  }

  return { valid: true };
}

/**
 * Create helpful error message from validation result
 */
export function createValidationError(result: ValidationResult): Error {
  return new Error(result.error || 'Valideringsfel');
}

/**
 * Transform API error into helpful message
 */
export function transformApiError(error: unknown, context: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // 404 - Not Found
    if (message.includes('404') || message.includes('not found')) {
      return `${context}: Resursen hittades inte. Kontrollera att koden/ID:t är korrekt. Ursprungligt fel: ${error.message}`;
    }

    // 400 - Bad Request
    if (message.includes('400') || message.includes('bad request')) {
      return `${context}: Ogiltig förfrågan. Kontrollera att alla parametrar har korrekta format. Ursprungligt fel: ${error.message}`;
    }

    // 500 - Server Error
    if (message.includes('500') || message.includes('server error')) {
      return `${context}: Serverfel hos Skolverket. Försök igen om en stund. Ursprungligt fel: ${error.message}`;
    }

    // 503 - Service Unavailable
    if (message.includes('503') || message.includes('unavailable')) {
      return `${context}: Tjänsten är tillfälligt otillgänglig. Försök igen om en stund.`;
    }

    // Timeout
    if (message.includes('timeout') || message.includes('timed out')) {
      return `${context}: Förfrågan tog för lång tid. Försök igen eller minska antalet resultat.`;
    }

    // Network errors
    if (message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) {
      return `${context}: Nätverksfel. Kontrollera internetanslutningen. Ursprungligt fel: ${error.message}`;
    }

    return `${context}: ${error.message}`;
  }

  return `${context}: ${String(error)}`;
}
