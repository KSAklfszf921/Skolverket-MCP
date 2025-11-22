/**
 * V4 Verktyg för skolenheter med utökad funktionalitet
 * Inkluderar statistik, enkäter, dokument och utbildningstillfällen
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';
import {
  validateSkolenhetskod,
  validateSchoolYear,
  validateStatus,
  validatePagination,
  validateCoordinates,
  validateSurveyYear,
  createValidationError,
  transformApiError
} from '../../utils/validation.js';

// =====  SEARCH SCHOOL UNITS V4 =====

export const searchSchoolUnitsV4Schema = {
  name: z.string().optional().describe('Sök efter skolenhet med namn'),
  schoolType: z.string().optional().describe('Skoltyp (t.ex. "Grundskola", "Gymnasieskola")'),
  municipality: z.string().optional().describe('Kommun (namn)'),
  municipalityCode: z.string().optional().describe('Kommunkod'),
  county: z.string().optional().describe('Län (namn)'),
  countyCode: z.string().optional().describe('Länskod'),
  status: z.string().optional().describe('Status (t.ex. "AKTIV", "UPPHÖRD", "VILANDE")'),
  geographicalAreaCode: z.string().optional().describe('Geografisk områdeskod'),
  principalOrganizerType: z.string().optional().describe('Huvudmans typ'),
  page: z.number().optional().default(0).describe('Sidnummer (0-indexerat)'),
  size: z.number().optional().default(20).describe('Antal resultat per sida'),
  sort: z.string().optional().describe('Sortering (t.ex. "name,asc")')
};

export async function searchSchoolUnitsV4(params: {
  name?: string;
  schoolType?: string;
  municipality?: string;
  municipalityCode?: string;
  county?: string;
  countyCode?: string;
  status?: string;
  geographicalAreaCode?: string;
  principalOrganizerType?: string;
  page?: number;
  size?: number;
  sort?: string;
}) {
  try {
    // Validate status
    if (params.status) {
      const statusValidation = validateStatus(params.status);
      if (!statusValidation.valid) {
        throw createValidationError(statusValidation);
      }
    }

    // Validate pagination
    const paginationValidation = validatePagination(params.page, params.size);
    if (!paginationValidation.valid) {
      throw createValidationError(paginationValidation);
    }

    const result = await plannedEducationApi.searchSchoolUnitsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            page: result.page,
            schoolUnits: result._embedded.schoolUnits,
            _links: result._links
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: transformApiError(error, 'Fel vid sökning av skolenheter (v4)')
        }
      ],
      isError: true
    };
  }
}

// ===== GET SCHOOL UNIT DETAILS V4 =====

export const getSchoolUnitDetailsV4Schema = {
  code: z.string().describe('Skolenhetskod (t.ex. "29824923")')
};

export async function getSchoolUnitDetailsV4(params: { code: string }) {
  try {
    // Validate skolenhetskod
    const codeValidation = validateSkolenhetskod(params.code);
    if (!codeValidation.valid) {
      throw createValidationError(codeValidation);
    }

    const unit = await plannedEducationApi.getSchoolUnitDetailsV4(params.code);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(unit, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: transformApiError(error, 'Fel vid hämtning av skolenhetsdetaljer (v4)')
        }
      ],
      isError: true
    };
  }
}

// ===== SCHOOL UNIT EDUCATION EVENTS =====

export const getSchoolUnitEducationEventsSchema = {
  code: z.string().describe('Skolenhetskod'),
  typeOfSchool: z.string().optional().describe('Typ av skola'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  geographicalAreaCode: z.string().optional().describe('Geografisk områdeskod'),
  distance: z.boolean().optional().describe('Distansutbildning (true/false)'),
  paceOfStudy: z.string().optional().describe('Studietakt'),
  semesterStartFrom: z.string().optional().describe('Terminsstart från datum (YYYY-MM-DD)'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida')
};

export async function getSchoolUnitEducationEvents(params: {
  code: string;
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  geographicalAreaCode?: string;
  distance?: boolean;
  paceOfStudy?: string;
  semesterStartFrom?: string;
  page?: number;
  size?: number;
}) {
  try {
    const { code, ...searchParams } = params;
    const result = await plannedEducationApi.getSchoolUnitEducationEvents(code, searchParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: code,
            page: result.page,
            educationEvents: result._embedded.educationEvents
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av utbildningstillfällen: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SCHOOL UNIT COMPACT EDUCATION EVENTS =====

export const getSchoolUnitCompactEducationEventsSchema = {
  code: z.string().describe('Skolenhetskod'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida')
};

export async function getSchoolUnitCompactEducationEvents(params: {
  code: string;
  page?: number;
  size?: number;
}) {
  try {
    const { code, ...searchParams } = params;
    const result = await plannedEducationApi.getSchoolUnitCompactEducationEvents(code, searchParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: code,
            page: result.page,
            compactEducationEvents: result._embedded.compactEducationEvents
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av kompakta utbildningstillfällen: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== CALCULATE DISTANCE FROM SCHOOL UNIT =====

export const calculateDistanceFromSchoolUnitSchema = {
  code: z.string().describe('Skolenhetskod att beräkna avstånd från'),
  latitude: z.number().describe('Latitud för målpunkt'),
  longitude: z.number().describe('Longitud för målpunkt')
};

export async function calculateDistanceFromSchoolUnit(params: {
  code: string;
  latitude: number;
  longitude: number;
}) {
  try {
    // Validate skolenhetskod
    const codeValidation = validateSkolenhetskod(params.code);
    if (!codeValidation.valid) {
      throw createValidationError(codeValidation);
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(params.latitude, params.longitude);
    if (!coordValidation.valid) {
      throw createValidationError(coordValidation);
    }

    const result = await plannedEducationApi.calculateDistanceFromSchoolUnit(
      params.code,
      params.latitude,
      params.longitude
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: transformApiError(error, 'Fel vid beräkning av avstånd')
        }
      ],
      isError: true
    };
  }
}

// ===== SCHOOL UNIT DOCUMENTS =====

export const getSchoolUnitDocumentsSchema = {
  code: z.string().describe('Skolenhetskod'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida')
};

export async function getSchoolUnitDocuments(params: {
  code: string;
  page?: number;
  size?: number;
}) {
  try {
    const { code, ...searchParams } = params;
    const result = await plannedEducationApi.getSchoolUnitDocuments(code, searchParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: code,
            page: result.page,
            documents: result._embedded.documents
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av dokument: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SCHOOL UNIT STATISTICS LINKS =====

export const getSchoolUnitStatisticsLinksSchema = {
  code: z.string().describe('Skolenhetskod')
};

export async function getSchoolUnitStatisticsLinks(params: { code: string }) {
  try {
    const result = await plannedEducationApi.getSchoolUnitStatisticsLinks(params.code);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av statistiklänkar: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SCHOOL UNIT STATISTICS BY TYPE =====

export const getSchoolUnitStatisticsFSKSchema = {
  code: z.string().describe('Skolenhetskod'),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")')
};

export async function getSchoolUnitStatisticsFSK(params: { code: string; schoolYear?: string }) {
  try {
    // Validate skolenhetskod
    const codeValidation = validateSkolenhetskod(params.code);
    if (!codeValidation.valid) {
      throw createValidationError(codeValidation);
    }

    // Validate school year
    if (params.schoolYear) {
      const yearValidation = validateSchoolYear(params.schoolYear);
      if (!yearValidation.valid) {
        throw createValidationError(yearValidation);
      }
    }

    const { code, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitStatisticsFSK(code, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: code,
            schoolType: 'FSK',
            statistics: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: transformApiError(error, 'Fel vid hämtning av FSK-statistik')
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitStatisticsGRSchema = {
  code: z.string().describe('Skolenhetskod'),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")')
};

export async function getSchoolUnitStatisticsGR(params: { code: string; schoolYear?: string }) {
  try {
    const { code, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitStatisticsGR(code, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: code,
            schoolType: 'GR',
            statistics: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av GR-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitStatisticsGRANSchema = {
  code: z.string().describe('Skolenhetskod'),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")')
};

export async function getSchoolUnitStatisticsGRAN(params: { code: string; schoolYear?: string }) {
  try {
    const { code, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitStatisticsGRAN(code, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: code,
            schoolType: 'GRAN',
            statistics: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av GRAN-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitStatisticsGYSchema = {
  code: z.string().describe('Skolenhetskod'),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")')
};

export async function getSchoolUnitStatisticsGY(params: { code: string; schoolYear?: string }) {
  try {
    const { code, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitStatisticsGY(code, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: code,
            schoolType: 'GY',
            statistics: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av GY-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitStatisticsGYANSchema = {
  code: z.string().describe('Skolenhetskod'),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")')
};

export async function getSchoolUnitStatisticsGYAN(params: { code: string; schoolYear?: string }) {
  try {
    const { code, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitStatisticsGYAN(code, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: code,
            schoolType: 'GYAN',
            statistics: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av GYAN-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SCHOOL UNIT SURVEYS =====

export const getSchoolUnitSurveyNestedSchema = {
  code: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår (t.ex. "2023")')
};

export async function getSchoolUnitSurveyNested(params: { code: string; surveyYear?: string }) {
  try {
    const { code, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitSurveyNested(code, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av enkätdata (nested): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitSurveyFlatSchema = {
  code: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår (t.ex. "2023")')
};

export async function getSchoolUnitSurveyFlat(params: { code: string; surveyYear?: string }) {
  try {
    const { code, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitSurveyFlat(code, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av enkätdata (flat): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
