/**
 * Verktyg för att hantera ämnen (subjects)
 */

import { z } from 'zod';
import { syllabusApi } from '../../api/syllabus-client.js';

// Zod-scheman för validering
export const searchSubjectsSchema = {
  schooltype: z.string().optional().describe('Skoltyp (t.ex. "GR" för grundskola, "GY" för gymnasium)'),
  timespan: z.enum(['LATEST', 'HISTORIC', 'ALL']).default('LATEST').describe('Tidsperiod för ämnen'),
  typeOfSyllabus: z.string().optional().describe('Typ av läroplan')
};

export const getSubjectDetailsSchema = {
  code: z.string().describe('Ämneskod (t.ex. "GRGRMAT01" för matematik i grundskolan)'),
  version: z.number().optional().describe('Versionsnummer (lämna tomt för senaste versionen)')
};

export const getSubjectVersionsSchema = {
  code: z.string().describe('Ämneskod att hämta versioner för')
};

// Verktygsimplementationer
export async function searchSubjects(params: {
  schooltype?: string;
  timespan?: 'LATEST' | 'HISTORIC' | 'ALL';
  typeOfSyllabus?: string;
}) {
  try {
    const result = await syllabusApi.searchSubjects(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalElements: result.totalElements,
            subjects: result.subjects.map(s => ({
              code: s.code,
              name: s.name,
              schoolType: s.schoolType,
              typeOfSyllabus: s.typeOfSyllabus,
              version: s.version,
              description: s.description?.substring(0, 200) + (s.description && s.description.length > 200 ? '...' : '')
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
          text: `Fel vid sökning av ämnen: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getSubjectDetails(params: {
  code: string;
  version?: number;
}) {
  try {
    const subject = await syllabusApi.getSubject(params.code, params.version);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(subject, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av ämnesdetaljer: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getSubjectVersions(params: {
  code: string;
}) {
  try {
    const versions = await syllabusApi.getSubjectVersions(params.code);

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
          text: `Fel vid hämtning av ämnesversioner: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
