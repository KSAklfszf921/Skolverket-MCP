/**
 * V4 Specialiserade survey-endpoints
 * 11 endpoints för specifika kombinationer av skolform och kategori
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// ===== NESTED SURVEYS - CUSTODIANS (VÅRDNADSHAVARE) =====

export const getSchoolUnitNestedSurveyCustodiansFSKSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår'),
  questionGroup: z.string().optional().describe('Frågegrupp')
};

export async function getSchoolUnitNestedSurveyCustodiansFSK(params: {
  schoolUnitCode: string;
  surveyYear?: string;
  questionGroup?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitNestedSurveyCustodiansFSK(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'custodians',
            typeOfSchooling: 'fsk',
            format: 'nested',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vårdnadshavares enkätdata (FSK, nested): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitNestedSurveyCustodiansGRSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår'),
  questionGroup: z.string().optional().describe('Frågegrupp')
};

export async function getSchoolUnitNestedSurveyCustodiansGR(params: {
  schoolUnitCode: string;
  surveyYear?: string;
  questionGroup?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitNestedSurveyCustodiansGR(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'custodians',
            typeOfSchooling: 'gr',
            format: 'nested',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vårdnadshavares enkätdata (GR, nested): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitNestedSurveyCustodiansGRANSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår'),
  questionGroup: z.string().optional().describe('Frågegrupp')
};

export async function getSchoolUnitNestedSurveyCustodiansGRAN(params: {
  schoolUnitCode: string;
  surveyYear?: string;
  questionGroup?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitNestedSurveyCustodiansGRAN(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'custodians',
            typeOfSchooling: 'gran',
            format: 'nested',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vårdnadshavares enkätdata (GRAN, nested): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== NESTED SURVEYS - PUPILS (ELEVER) =====

export const getSchoolUnitNestedSurveyPupilsGYSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår'),
  questionGroup: z.string().optional().describe('Frågegrupp')
};

export async function getSchoolUnitNestedSurveyPupilsGY(params: {
  schoolUnitCode: string;
  surveyYear?: string;
  questionGroup?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitNestedSurveyPupilsGY(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'pupils',
            typeOfSchooling: 'gy',
            format: 'nested',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av elevers enkätdata (GY, nested): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== FLAT SURVEYS - CUSTODIANS (VÅRDNADSHAVARE) =====

export const getSchoolUnitFlatSurveyCustodiansFSKSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår')
};

export async function getSchoolUnitFlatSurveyCustodiansFSK(params: {
  schoolUnitCode: string;
  surveyYear?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitFlatSurveyCustodiansFSK(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'custodians',
            typeOfSchooling: 'fsk',
            format: 'flat',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vårdnadshavares enkätdata (FSK, flat): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitFlatSurveyCustodiansGRSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår')
};

export async function getSchoolUnitFlatSurveyCustodiansGR(params: {
  schoolUnitCode: string;
  surveyYear?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitFlatSurveyCustodiansGR(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'custodians',
            typeOfSchooling: 'gr',
            format: 'flat',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vårdnadshavares enkätdata (GR, flat): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitFlatSurveyCustodiansGRANSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår')
};

export async function getSchoolUnitFlatSurveyCustodiansGRAN(params: {
  schoolUnitCode: string;
  surveyYear?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitFlatSurveyCustodiansGRAN(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'custodians',
            typeOfSchooling: 'gran',
            format: 'flat',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vårdnadshavares enkätdata (GRAN, flat): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== FLAT SURVEYS - PUPILS (ELEVER) =====

export const getSchoolUnitFlatSurveyPupilsGRSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår')
};

export async function getSchoolUnitFlatSurveyPupilsGR(params: {
  schoolUnitCode: string;
  surveyYear?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitFlatSurveyPupilsGR(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'pupils',
            typeOfSchooling: 'gr',
            format: 'flat',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av elevers enkätdata (GR, flat): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export const getSchoolUnitFlatSurveyPupilsGYSchema = {
  schoolUnitCode: z.string().describe('Skolenhetskod'),
  surveyYear: z.string().optional().describe('Enkätår')
};

export async function getSchoolUnitFlatSurveyPupilsGY(params: {
  schoolUnitCode: string;
  surveyYear?: string;
}) {
  try {
    const { schoolUnitCode, ...queryParams } = params;
    const result = await plannedEducationApi.getSchoolUnitFlatSurveyPupilsGY(schoolUnitCode, queryParams);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: result.schoolUnitCode,
            category: 'pupils',
            typeOfSchooling: 'gy',
            format: 'flat',
            metadata: result.metadata,
            data: result.data
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av elevers enkätdata (GY, flat): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
