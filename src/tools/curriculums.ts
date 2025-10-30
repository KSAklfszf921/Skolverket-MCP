/**
 * Verktyg för att hantera läroplaner (curriculums)
 */

import { z } from 'zod';
import { skolverketApi } from '../api/client.js';

// Zod-scheman för validering
export const searchCurriculumsSchema = {
  schooltype: z.string().optional().describe('Skoltyp (t.ex. "GR" för grundskola, "GY" för gymnasium)'),
  timespan: z.enum(['LATEST', 'HISTORIC', 'ALL']).default('LATEST').describe('Tidsperiod för läroplaner'),
  typeOfSyllabus: z.string().optional().describe('Typ av läroplan')
};

export const getCurriculumDetailsSchema = {
  code: z.string().describe('Läroplanskod (t.ex. "LGR11" för Läroplan för grundskolan 2011)'),
  version: z.number().optional().describe('Versionsnummer (lämna tomt för senaste versionen)')
};

export const getCurriculumVersionsSchema = {
  code: z.string().describe('Läroplanskod att hämta versioner för')
};

// Verktygsimplementationer
export async function searchCurriculums(params: {
  schooltype?: string;
  timespan?: 'LATEST' | 'HISTORIC' | 'ALL';
  typeOfSyllabus?: string;
}) {
  try {
    const result = await skolverketApi.searchCurriculums(params);

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
}) {
  try {
    const curriculum = await skolverketApi.getCurriculum(params.code, params.version);

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
    const versions = await skolverketApi.getCurriculumVersions(params.code);

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
