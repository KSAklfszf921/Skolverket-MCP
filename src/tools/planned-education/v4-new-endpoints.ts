/**
 * V4 Nya endpoints - Alla saknade endpoints från gap-analysen
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// ===== GET ADULT EDUCATION AREAS V4 =====

export const getAdultEducationAreasV4Schema = {};

export async function getAdultEducationAreasV4() {
  try {
    const result = await plannedEducationApi.getAdultEducationAreasV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalAreas: result.areas.length,
            areas: result.areas
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vuxenutbildningsområden: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET API INFO V4 =====

export const getApiInfoV4Schema = {};

export async function getApiInfoV4() {
  try {
    const result = await plannedEducationApi.getApiInfoV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result.apiInfo, null, 2)
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

// ===== SEARCH COMPACT SCHOOL UNITS V4 =====

export const searchCompactSchoolUnitsV4Schema = {
  name: z.string().optional().describe('Skolenhetens namn'),
  schoolType: z.string().optional().describe('Typ av skola (t.ex. Grundskola, Gymnasium)'),
  municipality: z.string().optional().describe('Kommun'),
  municipalityCode: z.string().optional().describe('Kommunkod'),
  county: z.string().optional().describe('Län'),
  countyCode: z.string().optional().describe('Länskod'),
  status: z.string().optional().describe('Status (t.ex. aktiv, nedlagd)'),
  geographicalAreaCode: z.string().optional().describe('Geografisk områdeskod'),
  principalOrganizerType: z.string().optional().describe('Huvudmannatyp'),
  coordinateSystemType: z.string().optional().default('WGS84').describe('Koordinatsystem (WGS84 eller SWEREF99)'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida'),
  sort: z.string().optional().describe('Sortering')
};

export async function searchCompactSchoolUnitsV4(params: {
  name?: string;
  schoolType?: string;
  municipality?: string;
  municipalityCode?: string;
  county?: string;
  countyCode?: string;
  status?: string;
  geographicalAreaCode?: string;
  principalOrganizerType?: string;
  coordinateSystemType?: string;
  page?: number;
  size?: number;
  sort?: string;
}) {
  try {
    const result = await plannedEducationApi.searchCompactSchoolUnitsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            page: result.page,
            totalSchoolUnits: result.page?.totalElements || 0,
            compactSchoolUnits: result._embedded.compactSchoolUnits,
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
          text: `Fel vid sökning av kompakta skolenheter: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET SECONDARY SCHOOL UNITS V4 =====

export const getSecondarySchoolUnitsV4Schema = {
  parentSchoolUnitCode: z.string().optional().describe('Överordnad skolenhetskod'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  status: z.string().optional().describe('Status'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida')
};

export async function getSecondarySchoolUnitsV4(params: {
  parentSchoolUnitCode?: string;
  municipality?: string;
  county?: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  try {
    const result = await plannedEducationApi.getSecondarySchoolUnitsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            page: result.page,
            totalSecondaryUnits: result.page?.totalElements || 0,
            secondarySchoolUnits: result._embedded.secondarySchoolUnits,
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
          text: `Fel vid hämtning av sekundära skolenheter: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== ALL SCHOOLS SALSA STATISTICS =====

export const getAllSchoolsSALSAStatisticsSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. 2023/2024)'),
  typeOfSchooling: z.string().optional().describe('Skolform (gr, gran, etc.)'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län')
};

export async function getAllSchoolsSALSAStatistics(params: {
  schoolYear?: string;
  typeOfSchooling?: string;
  municipality?: string;
  county?: string;
}) {
  try {
    const result = await plannedEducationApi.getAllSchoolsSALSAStatistics(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            statistics: result.data,
            totalSchools: result.data.schools.length,
            nationalAverage: result.data.nationalAverage,
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
          text: `Fel vid hämtning av SALSA-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SCHOOL UNIT SALSA STATISTICS =====

export const getSchoolUnitSALSAStatisticsSchema = {
  schoolUnitId: z.string().describe('Skolenhetskod'),
  schoolYear: z.string().optional().describe('Läsår'),
  typeOfSchooling: z.string().optional().describe('Skolform')
};

export async function getSchoolUnitSALSAStatistics(params: {
  schoolUnitId: string;
  schoolYear?: string;
  typeOfSchooling?: string;
}) {
  try {
    const { schoolUnitId, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitSALSAStatistics(schoolUnitId, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            schoolUnitName: result.schoolUnitName,
            salsaData: result.salsaData,
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
          text: `Fel vid hämtning av skolenhetens SALSA-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET DOCUMENTS BY TYPE OF SCHOOLING =====

export const getSchoolUnitDocumentsByTypeSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  typeOfSchooling: z.string().describe('Skolform (t.ex. gr, gy, fsk)'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida')
};

export async function getSchoolUnitDocumentsByType(params: {
  schoolUnitCode: string;
  typeOfSchooling: string;
  page?: number;
  size?: number;
}) {
  try {
    const { schoolUnitCode, typeOfSchooling, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitDocumentsByType(schoolUnitCode, typeOfSchooling, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            typeOfSchooling: result.typeOfSchooling,
            page: result.page,
            totalDocuments: result.page?.totalElements || 0,
            documents: result._embedded.documents,
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
          text: `Fel vid hämtning av dokument per skolform: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET EDUCATION EVENTS BY STUDY PATH =====

export const getSchoolUnitEducationEventsByStudyPathSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  studyPathCode: z.string().describe('Studievägskod (programkod)'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida')
};

export async function getSchoolUnitEducationEventsByStudyPath(params: {
  schoolUnitCode: string;
  studyPathCode: string;
  page?: number;
  size?: number;
}) {
  try {
    const { schoolUnitCode, studyPathCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitEducationEventsByStudyPath(schoolUnitCode, studyPathCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            studyPathCode: result.studyPathCode,
            studyPathName: result.studyPathName,
            page: result.page,
            totalEducationEvents: result.page?.totalElements || 0,
            educationEvents: result._embedded.educationEvents,
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
          text: `Fel vid hämtning av utbildningstillfällen per studieväg: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
