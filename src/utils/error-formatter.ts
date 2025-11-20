/**
 * Error formatting utilities för bättre användarmeddelanden
 */

import { SkolverketApiError, ValidationError, AuthenticationError, RateLimitError } from '../errors.js';

export interface FormattedError {
  message: string;
  type: string;
  details?: any;
  suggestions?: string[];
}

/**
 * Formatera fel för användarvänlig visning
 */
export function formatError(error: unknown): FormattedError {
  // Hantera kända feltyper
  if (error instanceof RateLimitError) {
    return {
      message: 'API-gränsen har nåtts. Vänligen försök igen om en stund.',
      type: 'RateLimit',
      details: error.retryAfter ? `Försök igen om ${error.retryAfter} sekunder` : undefined,
      suggestions: [
        'Vänta några sekunder innan du försöker igen',
        'Begränsa antalet samtidiga förfrågningar',
        'Kontakta administratör om problemet kvarstår'
      ]
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      message: 'Autentiseringsfel vid anrop till Skolverkets API',
      type: 'Authentication',
      suggestions: [
        'Kontrollera att API-nyckeln är korrekt konfigurerad',
        'Verifiera att du har behörighet till API:et',
        'Kontakta Skolverket för åtkomst'
      ]
    };
  }

  if (error instanceof ValidationError) {
    return {
      message: `Valideringsfel: ${error.message}`,
      type: 'Validation',
      details: {
        field: error.field,
        value: error.value
      },
      suggestions: [
        'Kontrollera att alla obligatoriska fält är ifyllda',
        'Verifiera att värden har rätt format',
        'Se dokumentationen för korrekt användning'
      ]
    };
  }

  if (error instanceof SkolverketApiError) {
    const suggestions: string[] = [];

    if (error.statusCode === 404) {
      suggestions.push(
        'Kontrollera att koden är korrekt',
        'Försök söka efter resursen istället för att hämta direkt',
        'Verifiera att resursen existerar i Skolverkets system'
      );
    } else if (error.statusCode && error.statusCode >= 500) {
      suggestions.push(
        'Skolverkets API har tillfälliga problem',
        'Försök igen om en stund',
        'Kontakta Skolverket om problemet kvarstår'
      );
    }

    return {
      message: error.message,
      type: 'ApiError',
      details: {
        statusCode: error.statusCode,
        url: error.url,
        attempts: error.attempts
      },
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  // Hantera vanliga Error-objekt
  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'Error',
      suggestions: [
        'Kontrollera din inmatning',
        'Försök igen',
        'Kontakta support om problemet kvarstår'
      ]
    };
  }

  // Fallback för okända fel
  return {
    message: String(error),
    type: 'Unknown',
    suggestions: ['Ett oväntat fel inträffade', 'Försök igen eller kontakta support']
  };
}

/**
 * Skapa användarvänligt felmeddelande för MCP-svar
 */
export function createErrorResponse(error: unknown) {
  const formatted = formatError(error);

  let message = `❌ ${formatted.message}\n`;

  if (formatted.details) {
    message += `\nDetaljer:\n${JSON.stringify(formatted.details, null, 2)}\n`;
  }

  if (formatted.suggestions && formatted.suggestions.length > 0) {
    message += `\n💡 Förslag:\n`;
    formatted.suggestions.forEach((suggestion, index) => {
      message += `${index + 1}. ${suggestion}\n`;
    });
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: message
      }
    ],
    isError: true
  };
}

/**
 * Sanitize error för logging (ta bort känslig data)
 */
export function sanitizeErrorForLogging(error: unknown): any {
  if (error instanceof SkolverketApiError) {
    return {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      url: error.url,
      attempts: error.attempts,
      timestamp: error.timestamp
      // Exkludera apiResponse som kan innehålla känslig data
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n') // Begränsa stack trace
    };
  }

  return String(error);
}
