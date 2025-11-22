/**
 * Meta-verktyg för att konsolidera skolenhetsverktyg
 */

import { z } from 'zod';
import {
  getSchoolUnitStatisticsFSK,
  getSchoolUnitStatisticsGR,
  getSchoolUnitStatisticsGRAN,
  getSchoolUnitStatisticsGY,
  getSchoolUnitStatisticsGYAN,
  getSchoolUnitSurveyNested,
  getSchoolUnitSurveyFlat
} from './v4.js';

// ===== CONSOLIDATED SCHOOL UNIT STATISTICS =====

export const getSchoolUnitStatisticsSchema = {
  code: z.string().describe('Skolenhetskod (8 siffror)'),
  schoolType: z.enum(['fsk', 'gr', 'gran', 'gy', 'gyan']).describe(
    'Skoltyp: fsk (förskoleklass), gr (grundskola), gran (grundsärskola), gy (gymnasium), gyan (gymnasiesärskola)'
  ),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")')
};

export async function getSchoolUnitStatistics(params: {
  code: string;
  schoolType: 'fsk' | 'gr' | 'gran' | 'gy' | 'gyan';
  schoolYear?: string;
}) {
  const { schoolType, ...otherParams } = params;

  switch (schoolType) {
    case 'fsk':
      return getSchoolUnitStatisticsFSK(otherParams);
    case 'gr':
      return getSchoolUnitStatisticsGR(otherParams);
    case 'gran':
      return getSchoolUnitStatisticsGRAN(otherParams);
    case 'gy':
      return getSchoolUnitStatisticsGY(otherParams);
    case 'gyan':
      return getSchoolUnitStatisticsGYAN(otherParams);
    default:
      return {
        content: [
          {
            type: 'text' as const,
            text: `Ogiltig skoltyp: ${schoolType}. Välj mellan fsk, gr, gran, gy eller gyan.`
          }
        ],
        isError: true
      };
  }
}

// ===== CONSOLIDATED SCHOOL UNIT SURVEY =====

export const getSchoolUnitSurveySchema = {
  code: z.string().describe('Skolenhetskod (8 siffror)'),
  format: z.enum(['nested', 'flat']).describe(
    'Format: nested (hierarkisk struktur) eller flat (platt struktur med "." notation)'
  ),
  surveyYear: z.string().optional().describe('Enkätår (t.ex. "2023")')
};

export async function getSchoolUnitSurvey(params: {
  code: string;
  format: 'nested' | 'flat';
  surveyYear?: string;
}) {
  const { format, ...otherParams } = params;

  switch (format) {
    case 'nested':
      return getSchoolUnitSurveyNested(otherParams);
    case 'flat':
      return getSchoolUnitSurveyFlat(otherParams);
    default:
      return {
        content: [
          {
            type: 'text' as const,
            text: `Ogiltigt format: ${format}. Välj mellan nested eller flat.`
          }
        ],
        isError: true
      };
  }
}
