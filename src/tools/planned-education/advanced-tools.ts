/**
 * Avancerade verktyg för Planned Education API
 * Fas 3: Statistics, documents, och meta-tools
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// ===== GET SCHOOL UNIT DOCUMENTS =====

export const getSchoolUnitDocumentsSchema = {
  code: z.string().describe('Skolenhetskod (8 siffror)'),
  typeOfSchooling: z.string().optional().describe('Skolform (fsk, gr, gran, gy, gyan)'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida (max 100)'),
  limit: z.number().optional().default(50).describe('Max antal resultat (max 200)')
};

export async function getSchoolUnitDocuments(params: {
  code: string;
  typeOfSchooling?: string;
  page?: number;
  size?: number;
  limit?: number;
}) {
  try {
    const pageSize = Math.min(params.size || 20, 100);
    const maxResults = Math.min(params.limit || 50, 200);

    const result = params.typeOfSchooling
      ? await plannedEducationApi.getSchoolUnitDocumentsByType(params.code, params.typeOfSchooling, {
          page: params.page,
          size: pageSize
        })
      : await plannedEducationApi.getSchoolUnitDocuments(params.code, {
          page: params.page,
          size: pageSize
        });

    const documents = result._embedded?.documents || [];
    const limitedDocs = documents.slice(0, maxResults);
    const totalElements = result.page?.totalElements || documents.length;
    const hasMore = totalElements > maxResults;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: params.code,
            totalElements,
            returned: limitedDocs.length,
            hasMore,
            message: hasMore ? `Visar ${limitedDocs.length} av ${totalElements} dokument.` : undefined,
            documents: limitedDocs.map((doc: any) => ({
              documentId: doc.documentId,
              title: doc.title,
              documentType: doc.documentType,
              publishedDate: doc.publishedDate,
              typeOfSchooling: doc.typeOfSchooling,
              url: doc.url
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
          text: `Fel vid hämtning av dokument: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET SCHOOL UNIT STATISTICS (META-TOOL) =====

export const getSchoolUnitStatisticsSchema = {
  code: z.string().describe('Skolenhetskod (8 siffror)'),
  schoolType: z.enum(['fsk', 'gr', 'gran', 'gy', 'gyan']).describe('Skolform (fsk=förskoleklass, gr=grundskola, gran=grundsärskola, gy=gymnasium, gyan=gymnasiesärskola)'),
  year: z.string().optional().describe('Läsår (t.ex. 2023/2024)')
};

export async function getSchoolUnitStatistics(params: {
  code: string;
  schoolType: 'fsk' | 'gr' | 'gran' | 'gy' | 'gyan';
  year?: string;
}) {
  try {
    let result;
    const queryParams = params.year ? { year: params.year } : {};

    switch (params.schoolType) {
      case 'fsk':
        result = await plannedEducationApi.getSchoolUnitStatisticsFSK(params.code, queryParams);
        break;
      case 'gr':
        result = await plannedEducationApi.getSchoolUnitStatisticsGR(params.code, queryParams);
        break;
      case 'gran':
        result = await plannedEducationApi.getSchoolUnitStatisticsGRAN(params.code, queryParams);
        break;
      case 'gy':
        result = await plannedEducationApi.getSchoolUnitStatisticsGY(params.code, queryParams);
        break;
      case 'gyan':
        result = await plannedEducationApi.getSchoolUnitStatisticsGYAN(params.code, queryParams);
        break;
      default:
        throw new Error(`Ogiltig skoltyp: ${params.schoolType}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: params.code,
            schoolType: params.schoolType,
            year: params.year,
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
          text: `Fel vid hämtning av statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET NATIONAL STATISTICS (META-TOOL) =====

export const getNationalStatisticsSchema = {
  schoolType: z.enum(['fsk', 'gr', 'gran', 'gy', 'gyan']).describe('Skolform'),
  year: z.string().optional().describe('Läsår (t.ex. 2023/2024)'),
  programCode: z.string().optional().describe('Programkod (endast för gy/gyan)')
};

export async function getNationalStatistics(params: {
  schoolType: 'fsk' | 'gr' | 'gran' | 'gy' | 'gyan';
  year?: string;
  programCode?: string;
}) {
  try {
    let result;
    const queryParams: any = {};
    if (params.year) queryParams.year = params.year;
    if (params.programCode) queryParams.programCode = params.programCode;

    switch (params.schoolType) {
      case 'fsk':
        result = await plannedEducationApi.getNationalStatisticsFSK(queryParams);
        break;
      case 'gr':
        result = await plannedEducationApi.getNationalStatisticsGR(queryParams);
        break;
      case 'gran':
        result = await plannedEducationApi.getNationalStatisticsGRAN(queryParams);
        break;
      case 'gy':
        result = await plannedEducationApi.getNationalStatisticsGY(queryParams);
        break;
      case 'gyan':
        result = await plannedEducationApi.getNationalStatisticsGYAN(queryParams);
        break;
      default:
        throw new Error(`Ogiltig skoltyp: ${params.schoolType}`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolType: params.schoolType,
            year: params.year,
            programCode: params.programCode,
            nationalStatistics: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av nationell statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET PROGRAM STATISTICS (META-TOOL) =====

export const getProgramStatisticsSchema = {
  schoolType: z.enum(['gy', 'gyan']).describe('Skolform (gy=gymnasium, gyan=gymnasiesärskola)'),
  year: z.string().optional().describe('Läsår')
};

export async function getProgramStatistics(params: {
  schoolType: 'gy' | 'gyan';
  year?: string;
}) {
  try {
    const queryParams = params.year ? { year: params.year } : {};

    const result = params.schoolType === 'gy'
      ? await plannedEducationApi.getProgramStatisticsGY(queryParams)
      : await plannedEducationApi.getProgramStatisticsGYAN(queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolType: params.schoolType,
            year: params.year,
            programStatistics: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av programstatistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
