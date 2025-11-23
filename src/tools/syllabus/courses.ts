/**
 * Verktyg för att hantera kurser (courses)
 */

import { z } from 'zod';
import { syllabusApi } from '../../api/syllabus-client.js';

// Zod-scheman för validering
export const searchCoursesSchema = {
  schooltype: z.string().optional().describe('Skoltyp (t.ex. "GY" för gymnasium)'),
  timespan: z.enum(['LATEST', 'FUTURE', 'EXPIRED', 'MODIFIED']).default('LATEST').describe('Tidsperiod: LATEST (gällande), FUTURE (framtida), EXPIRED (utgångna), MODIFIED (ändrade)'),
  date: z.string().optional().describe('Datum i formatet YYYY-MM-DD för att hämta kurser som var giltiga vid det datumet'),
  subjectCode: z.string().optional().describe('Ämneskod för att filtrera kurser'),
  limit: z.number().optional().default(50).describe('Max antal resultat att returnera (default: 50, max: 200)')
};

export const getCourseDetailsSchema = {
  code: z.string().describe('Kurskod (t.ex. "MATMAT01a" för Matematik 1a)'),
  version: z.number().optional().describe('Versionsnummer (lämna tomt för senaste versionen)'),
  date: z.string().optional().describe('Datum i formatet YYYY-MM-DD för att hämta versionen som var giltig vid det datumet')
};

export const getCourseVersionsSchema = {
  code: z.string().describe('Kurskod att hämta versioner för')
};

// Verktygsimplementationer
export async function searchCourses(params: {
  schooltype?: string;
  timespan?: 'LATEST' | 'FUTURE' | 'EXPIRED' | 'MODIFIED';
  date?: string;
  subjectCode?: string;
  limit?: number;
}) {
  try {
    const result = await syllabusApi.searchCourses(params);

    // Begränsa antal resultat för att undvika stora responses
    const maxResults = Math.min(params.limit || 50, 200);
    const limitedCourses = result.courses.slice(0, maxResults);
    const hasMore = result.totalElements > maxResults;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalElements: result.totalElements,
            returned: limitedCourses.length,
            hasMore: hasMore,
            message: hasMore ? `Visar ${limitedCourses.length} av ${result.totalElements} kurser. Använd subjectCode eller andra filter för att begränsa resultatet.` : undefined,
            courses: limitedCourses.map(c => ({
              code: c.code,
              name: c.name,
              subjectCode: c.subjectCode,
              schoolType: c.schoolType,
              points: c.points,
              version: c.version,
              description: c.description?.substring(0, 150) + (c.description && c.description.length > 150 ? '...' : '')
            }))
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid sökning av kurser: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getCourseDetails(params: {
  code: string;
  version?: number;
  date?: string;
}) {
  try {
    const course = await syllabusApi.getCourse(params.code, params.version, params.date);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(course, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av kursdetaljer: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getCourseVersions(params: {
  code: string;
}) {
  try {
    const versions = await syllabusApi.getCourseVersions(params.code);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            code: params.code,
            totalVersions: versions.totalElements,
            versions: versions.versions
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av kursversioner: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
