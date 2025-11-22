/**
 * Verktyg för att hantera cache i Skolverkets API
 */

import { z } from 'zod';
import { syllabusApi } from '../../api/syllabus-client.js';

// Zod-scheman för validering
export const clearCacheSchema = {
  auth: z.string().describe('Autentiseringsnyckel för att rensa cache')
};

// Verktygsimplementationer
export async function clearSubjectCache() {
  try {
    const response = await syllabusApi.clearSubjectCache();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            message: 'Ämnes-cache har rensats',
            response: response
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid rensning av ämnes-cache: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function clearProgramsCache() {
  try {
    const response = await syllabusApi.clearProgramsCache();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            message: 'Program-cache har rensats',
            response: response
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid rensning av program-cache: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function clearCache(params: {
  auth: string;
}) {
  try {
    const response = await syllabusApi.clearCache(params.auth);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            message: 'All cache har rensats',
            response: response
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid rensning av cache: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
