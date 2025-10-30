/**
 * Verktyg för att hantera kurser (courses)
 */

import { z } from 'zod';
import { syllabusApi } from '../../api/syllabus-client.js';

// Zod-scheman för validering
export const searchCoursesSchema = {
  schooltype: z.string().optional().describe('Skoltyp (t.ex. "GY" för gymnasium)'),
  timespan: z.enum(['LATEST', 'HISTORIC', 'ALL']).default('LATEST').describe('Tidsperiod för kurser'),
  typeOfSyllabus: z.string().optional().describe('Typ av läroplan'),
  subjectCode: z.string().optional().describe('Ämneskod för att filtrera kurser')
};

export const getCourseDetailsSchema = {
  code: z.string().describe('Kurskod (t.ex. "MATMAT01a" för Matematik 1a)'),
  version: z.number().optional().describe('Versionsnummer (lämna tomt för senaste versionen)')
};

export const getCourseVersionsSchema = {
  code: z.string().describe('Kurskod att hämta versioner för')
};

// Verktygsimplementationer
export async function searchCourses(params: {
  schooltype?: string;
  timespan?: 'LATEST' | 'HISTORIC' | 'ALL';
  typeOfSyllabus?: string;
  subjectCode?: string;
}) {
  try {
    const result = await syllabusApi.searchCourses(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalElements: result.totalElements,
            courses: result.courses.map(c => ({
              code: c.code,
              name: c.name,
              subjectCode: c.subjectCode,
              schoolType: c.schoolType,
              points: c.points,
              version: c.version,
              description: c.description?.substring(0, 200) + (c.description && c.description.length > 200 ? '...' : '')
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
}) {
  try {
    const course = await syllabusApi.getCourse(params.code, params.version);

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
