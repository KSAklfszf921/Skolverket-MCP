/**
 * Verktyg för att hantera program (gymnasieprogram och andra studievägar)
 */

import { z } from 'zod';
import { syllabusApi } from '../../api/syllabus-client.js';

// Zod-scheman för validering
export const searchProgramsSchema = {
  schooltype: z.string().optional().describe('Skoltyp (t.ex. "GY" för gymnasium)'),
  timespan: z.enum(['LATEST', 'FUTURE', 'EXPIRED', 'MODIFIED']).default('LATEST').describe('Tidsperiod: LATEST (gällande), FUTURE (framtida), EXPIRED (utgångna), MODIFIED (ändrade)'),
  date: z.string().optional().describe('Datum i formatet YYYY-MM-DD för att hämta program som var giltiga vid det datumet'),
  typeOfStudyPath: z.string().optional().describe('Typ av studieväg (t.ex. "PROGRAM" för gymnasieprogram)'),
  limit: z.number().optional().default(100).describe('Max antal resultat att returnera (default: 100, max: 200)')
};

export const getProgramDetailsSchema = {
  code: z.string().describe('Programkod (t.ex. "NA" för Naturvetenskapsprogrammet)'),
  version: z.number().optional().describe('Versionsnummer (lämna tomt för senaste versionen)'),
  date: z.string().optional().describe('Datum i formatet YYYY-MM-DD för att hämta versionen som var giltig vid det datumet')
};

export const getProgramVersionsSchema = {
  code: z.string().describe('Programkod att hämta versioner för')
};

// Verktygsimplementationer
export async function searchPrograms(params: {
  schooltype?: string;
  timespan?: 'LATEST' | 'FUTURE' | 'EXPIRED' | 'MODIFIED';
  date?: string;
  typeOfStudyPath?: string;
  limit?: number;
}) {
  try {
    const result = await syllabusApi.searchPrograms(params);

    // Begränsa antal resultat för att undvika stora responses
    const maxResults = Math.min(params.limit || 100, 200);
    const limitedPrograms = result.programs.slice(0, maxResults);
    const hasMore = result.totalElements > maxResults;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalElements: result.totalElements,
            returned: limitedPrograms.length,
            hasMore: hasMore,
            message: hasMore ? `Visar ${limitedPrograms.length} av ${result.totalElements} program. Öka limit-parametern för att se fler.` : undefined,
            programs: limitedPrograms.map(p => ({
              code: p.code,
              name: p.name,
              schoolType: p.schoolType,
              studyPathType: p.studyPathType,
              version: p.version,
              orientations: p.orientations?.map(o => o.name),
              profiles: p.profiles?.map(pr => pr.name),
              description: p.description?.substring(0, 150) + (p.description && p.description.length > 150 ? '...' : '')
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
          text: `Fel vid sökning av program: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getProgramDetails(params: {
  code: string;
  version?: number;
  date?: string;
}) {
  try {
    const program = await syllabusApi.getProgram(params.code, params.version, params.date);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(program, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av programdetaljer: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getProgramVersions(params: {
  code: string;
}) {
  try {
    const versions = await syllabusApi.getProgramVersions(params.code);

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
          text: `Fel vid hämtning av programversioner: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
