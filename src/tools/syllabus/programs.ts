/**
 * Verktyg för att hantera program (gymnasieprogram och andra studievägar)
 */

import { z } from 'zod';
import { syllabusApi } from '../../api/syllabus-client.js';

// Zod-scheman för validering
export const searchProgramsSchema = {
  schooltype: z.string().optional().describe('Skoltyp (t.ex. "GY" för gymnasium)'),
  timespan: z.enum(['LATEST', 'HISTORIC', 'ALL']).default('LATEST').describe('Tidsperiod för program'),
  typeOfSyllabus: z.string().optional().describe('Typ av läroplan'),
  studyPathType: z.string().optional().describe('Typ av studieväg')
};

export const getProgramDetailsSchema = {
  code: z.string().describe('Programkod (t.ex. "NA" för Naturvetenskapsprogrammet)'),
  version: z.number().optional().describe('Versionsnummer (lämna tomt för senaste versionen)')
};

export const getProgramVersionsSchema = {
  code: z.string().describe('Programkod att hämta versioner för')
};

// Verktygsimplementationer
export async function searchPrograms(params: {
  schooltype?: string;
  timespan?: 'LATEST' | 'HISTORIC' | 'ALL';
  typeOfSyllabus?: string;
  studyPathType?: string;
}) {
  try {
    const result = await syllabusApi.searchPrograms(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalElements: result.totalElements,
            programs: result.programs.map(p => ({
              code: p.code,
              name: p.name,
              schoolType: p.schoolType,
              studyPathType: p.studyPathType,
              version: p.version,
              orientations: p.orientations?.map(o => o.name),
              profiles: p.profiles?.map(pr => pr.name),
              description: p.description?.substring(0, 200) + (p.description && p.description.length > 200 ? '...' : '')
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
}) {
  try {
    const program = await syllabusApi.getProgram(params.code, params.version);

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
