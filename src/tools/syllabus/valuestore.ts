/**
 * Verktyg för att hämta värdesamlingar och referensdata
 */

import { z } from 'zod';
import { syllabusApi } from '../../api/syllabus-client.js';

// Zod-scheman för validering
export const getSchoolTypesSchema = {
  includeExpired: z.boolean().optional().default(false).describe('Inkludera utgångna skoltyper')
};

export const getStudyPathCodesSchema = {
  schooltype: z.string().optional().describe('Filtrera på skoltyp (t.ex. "GY" för gymnasium)'),
  timespan: z.enum(['LATEST', 'FUTURE', 'EXPIRED', 'MODIFIED']).optional().default('LATEST').describe('Tidsperiod: LATEST (gällande), FUTURE (framtida), EXPIRED (utgångna), MODIFIED (ändrade)'),
  date: z.string().optional().describe('Datum i formatet YYYY-MM-DD för att hämta studievägar som var giltiga vid det datumet'),
  typeOfStudyPath: z.string().optional().describe('Typ av studieväg (t.ex. "PROGRAM" för gymnasieprogram)'),
  typeOfProgram: z.string().optional().describe('Typ av program (t.ex. "HÖGSKOLEFÖRBEREDANDE", "YRKES")')
};

// Verktygsimplementationer
export async function getSchoolTypes(params: {
  includeExpired?: boolean;
}) {
  try {
    const activeTypes = await syllabusApi.getSchoolTypes();
    let expiredTypes: any[] = [];

    if (params.includeExpired) {
      expiredTypes = await syllabusApi.getExpiredSchoolTypes();
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            activeSchoolTypes: activeTypes,
            expiredSchoolTypes: params.includeExpired ? expiredTypes : undefined,
            total: activeTypes.length + expiredTypes.length
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av skoltyper: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getTypesOfSyllabus() {
  try {
    const types = await syllabusApi.getTypesOfSyllabus();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            typesOfSyllabus: types,
            total: types.length
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av läroplanstyper: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getSubjectAndCourseCodes() {
  try {
    const codes = await syllabusApi.getSubjectAndCourseCodes();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            codes: codes,
            total: codes.length,
            subjects: codes.filter(c => c.type === 'SUBJECT').length,
            courses: codes.filter(c => c.type === 'COURSE').length
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av ämnes- och kurskoder: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getStudyPathCodes(params: {
  schooltype?: string;
  timespan?: 'LATEST' | 'FUTURE' | 'EXPIRED' | 'MODIFIED';
  date?: string;
  typeOfStudyPath?: string;
  typeOfProgram?: string;
}) {
  try {
    const codes = await syllabusApi.getStudyPathCodes(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            studyPathCodes: codes,
            total: codes.length,
            filters: {
              schooltype: params.schooltype,
              timespan: params.timespan,
              date: params.date,
              typeOfStudyPath: params.typeOfStudyPath,
              typeOfProgram: params.typeOfProgram
            }
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av studievägskodar: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getApiInfo() {
  try {
    const info = await syllabusApi.getApiInfo();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(info, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av API-information: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
