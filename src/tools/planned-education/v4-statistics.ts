/**
 * V4 Verktyg för statistik - nationella värden, SALSA och per program
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';
import { validateSchoolYear, createValidationError, transformApiError } from '../../utils/validation.js';

// ===== NATIONAL STATISTICS FSK =====

export const getNationalStatisticsFSKSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  indicator: z.string().optional().describe('Specifik indikator att hämta')
};

export async function getNationalStatisticsFSK(params: {
  schoolYear?: string;
  indicator?: string;
}) {
  try {
    const result = await plannedEducationApi.getNationalStatisticsFSK(params);

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
          text: `Fel vid hämtning av nationell FSK-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== NATIONAL STATISTICS GR =====

export const getNationalStatisticsGRSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  indicator: z.string().optional().describe('Specifik indikator att hämta')
};

export async function getNationalStatisticsGR(params: {
  schoolYear?: string;
  indicator?: string;
}) {
  try {
    // Validate school year if provided
    if (params.schoolYear) {
      const yearValidation = validateSchoolYear(params.schoolYear);
      if (!yearValidation.valid) {
        throw createValidationError(yearValidation);
      }
    }

    const result = await plannedEducationApi.getNationalStatisticsGR(params);

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
          text: transformApiError(error, 'Fel vid hämtning av nationell GR-statistik')
        }
      ],
      isError: true
    };
  }
}

// ===== NATIONAL STATISTICS GRAN =====

export const getNationalStatisticsGRANSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  indicator: z.string().optional().describe('Specifik indikator att hämta')
};

export async function getNationalStatisticsGRAN(params: {
  schoolYear?: string;
  indicator?: string;
}) {
  try {
    const result = await plannedEducationApi.getNationalStatisticsGRAN(params);

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
          text: `Fel vid hämtning av nationell GRAN-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== NATIONAL STATISTICS GY =====

export const getNationalStatisticsGYSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  indicator: z.string().optional().describe('Specifik indikator att hämta')
};

export async function getNationalStatisticsGY(params: {
  schoolYear?: string;
  indicator?: string;
}) {
  try {
    const result = await plannedEducationApi.getNationalStatisticsGY(params);

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
          text: `Fel vid hämtning av nationell GY-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== NATIONAL STATISTICS GYAN =====

export const getNationalStatisticsGYANSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  indicator: z.string().optional().describe('Specifik indikator att hämta')
};

export async function getNationalStatisticsGYAN(params: {
  schoolYear?: string;
  indicator?: string;
}) {
  try {
    const result = await plannedEducationApi.getNationalStatisticsGYAN(params);

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
          text: `Fel vid hämtning av nationell GYAN-statistik: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SALSA STATISTICS GR =====

export const getSALSAStatisticsGRSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  subject: z.string().optional().describe('Ämne (t.ex. "Matematik", "Svenska")'),
  grade: z.string().optional().describe('Årskurs (t.ex. "3", "6", "9")')
};

export async function getSALSAStatisticsGR(params: {
  schoolYear?: string;
  subject?: string;
  grade?: string;
}) {
  try {
    const result = await plannedEducationApi.getSALSAStatisticsGR(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolType: 'GR',
            statisticsType: 'SALSA',
            ...result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av SALSA-statistik (GR): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SALSA STATISTICS GRAN =====

export const getSALSAStatisticsGRANSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  subject: z.string().optional().describe('Ämne'),
  grade: z.string().optional().describe('Årskurs')
};

export async function getSALSAStatisticsGRAN(params: {
  schoolYear?: string;
  subject?: string;
  grade?: string;
}) {
  try {
    const result = await plannedEducationApi.getSALSAStatisticsGRAN(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolType: 'GRAN',
            statisticsType: 'SALSA',
            ...result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av SALSA-statistik (GRAN): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== PROGRAM STATISTICS GY =====

export const getProgramStatisticsGYSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  programCode: z.string().optional().describe('Programkod (t.ex. "NA" för Naturvetenskapsprogrammet)'),
  orientation: z.string().optional().describe('Inriktning')
};

export async function getProgramStatisticsGY(params: {
  schoolYear?: string;
  programCode?: string;
  orientation?: string;
}) {
  try {
    const result = await plannedEducationApi.getProgramStatisticsGY(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolType: 'GY',
            statisticsType: 'per-program',
            ...result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av programstatistik (GY): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== PROGRAM STATISTICS GYAN =====

export const getProgramStatisticsGYANSchema = {
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  programCode: z.string().optional().describe('Programkod'),
  orientation: z.string().optional().describe('Inriktning')
};

export async function getProgramStatisticsGYAN(params: {
  schoolYear?: string;
  programCode?: string;
  orientation?: string;
}) {
  try {
    const result = await plannedEducationApi.getProgramStatisticsGYAN(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolType: 'GYAN',
            statisticsType: 'per-program',
            ...result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av programstatistik (GYAN): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
