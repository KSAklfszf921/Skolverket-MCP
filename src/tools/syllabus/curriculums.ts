/**
 * Verktyg för att hantera läroplaner (curriculums)
 */

import { z } from 'zod';
import { syllabusApi } from '../../api/syllabus-client.js';

// Zod-scheman för validering
export const searchCurriculumsSchema = {
  schooltype: z.string().optional().describe('Skoltyp (t.ex. "GR" för grundskola, "GY" för gymnasium)'),
  timespan: z.enum(['LATEST', 'FUTURE', 'EXPIRED', 'MODIFIED']).default('LATEST').describe('Tidsperiod: LATEST (gällande), FUTURE (framtida), EXPIRED (utgångna), MODIFIED (ändrade)'),
  date: z.string().optional().describe('Datum i formatet YYYY-MM-DD för att hämta läroplaner som var giltiga vid det datumet')
};

export const getCurriculumDetailsSchema = {
  code: z.string().describe('Läroplanskod (t.ex. "LGR11" för Läroplan för grundskolan 2011)'),
  version: z.number().optional().describe('Versionsnummer (lämna tomt för senaste versionen)'),
  date: z.string().optional().describe('Datum i formatet YYYY-MM-DD för att hämta versionen som var giltig vid det datumet')
};

export const getCurriculumVersionsSchema = {
  code: z.string().describe('Läroplanskod att hämta versioner för')
};

// Verktygsimplementationer
export async function searchCurriculums(params: {
  schooltype?: string;
  timespan?: 'LATEST' | 'FUTURE' | 'EXPIRED' | 'MODIFIED';
  date?: string;
}) {
  try {
    const result = await syllabusApi.searchCurriculums(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalElements: result.totalElements,
            curriculums: result.curriculums.map(c => ({
              code: c.code,
              name: c.name,
              schoolType: c.schoolType,
              typeOfSyllabus: c.typeOfSyllabus,
              version: c.version,
              validFrom: c.validFrom,
              validTo: c.validTo,
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
          text: `Fel vid sökning av läroplaner: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getCurriculumDetails(params: {
  code: string;
  version?: number;
  date?: string;
}) {
  try {
    const curriculum = await syllabusApi.getCurriculum(params.code, params.version, params.date);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(curriculum, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av läroplansdetaljer: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getCurriculumVersions(params: {
  code: string;
}) {
  try {
    const versions = await syllabusApi.getCurriculumVersions(params.code);

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
          text: `Fel vid hämtning av läroplansversioner: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
