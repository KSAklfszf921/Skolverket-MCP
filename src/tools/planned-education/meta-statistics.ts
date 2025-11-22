/**
 * Meta-verktyg för att konsolidera statistikverktyg
 * Dessa verktyg minskar antalet verktyg genom att använda skoltyp som parameter
 */

import { z } from 'zod';
import {
  getNationalStatisticsFSK,
  getNationalStatisticsGR,
  getNationalStatisticsGRAN,
  getNationalStatisticsGY,
  getNationalStatisticsGYAN,
  getSALSAStatisticsGR,
  getSALSAStatisticsGRAN,
  getProgramStatisticsGY,
  getProgramStatisticsGYAN
} from './v4-statistics.js';
import {
  searchEducationEventsV4,
  searchCompactEducationEventsV4
} from './v4-education-events.js';

// ===== CONSOLIDATED NATIONAL STATISTICS =====

export const getNationalStatisticsSchema = {
  schoolType: z.enum(['fsk', 'gr', 'gran', 'gy', 'gyan']).describe(
    'Skoltyp: fsk (förskoleklass), gr (grundskola), gran (grundsärskola), gy (gymnasium), gyan (gymnasiesärskola)'
  ),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  indicator: z.string().optional().describe('Specifik indikator att hämta')
};

export async function getNationalStatistics(params: {
  schoolType: 'fsk' | 'gr' | 'gran' | 'gy' | 'gyan';
  schoolYear?: string;
  indicator?: string;
}) {
  const { schoolType, ...otherParams } = params;

  switch (schoolType) {
    case 'fsk':
      return getNationalStatisticsFSK(otherParams);
    case 'gr':
      return getNationalStatisticsGR(otherParams);
    case 'gran':
      return getNationalStatisticsGRAN(otherParams);
    case 'gy':
      return getNationalStatisticsGY(otherParams);
    case 'gyan':
      return getNationalStatisticsGYAN(otherParams);
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

// ===== CONSOLIDATED SALSA STATISTICS =====

export const getSALSAStatisticsSchema = {
  schoolType: z.enum(['gr', 'gran']).describe('Skoltyp: gr (grundskola), gran (grundsärskola)'),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  subject: z.string().optional().describe('Ämne (t.ex. "Matematik", "Svenska")'),
  grade: z.string().optional().describe('Årskurs (t.ex. "3", "6", "9")')
};

export async function getSALSAStatistics(params: {
  schoolType: 'gr' | 'gran';
  schoolYear?: string;
  subject?: string;
  grade?: string;
}) {
  const { schoolType, ...otherParams } = params;

  switch (schoolType) {
    case 'gr':
      return getSALSAStatisticsGR(otherParams);
    case 'gran':
      return getSALSAStatisticsGRAN(otherParams);
    default:
      return {
        content: [
          {
            type: 'text' as const,
            text: `Ogiltig skoltyp för SALSA: ${schoolType}. Välj mellan gr eller gran.`
          }
        ],
        isError: true
      };
  }
}

// ===== CONSOLIDATED PROGRAM STATISTICS =====

export const getProgramStatisticsSchema = {
  schoolType: z.enum(['gy', 'gyan']).describe('Skoltyp: gy (gymnasium), gyan (gymnasiesärskola)'),
  schoolYear: z.string().optional().describe('Läsår (t.ex. "2023/2024")'),
  programCode: z.string().optional().describe('Programkod (t.ex. "NA" för Naturvetenskapsprogrammet)'),
  orientation: z.string().optional().describe('Inriktning')
};

export async function getProgramStatistics(params: {
  schoolType: 'gy' | 'gyan';
  schoolYear?: string;
  programCode?: string;
  orientation?: string;
}) {
  const { schoolType, ...otherParams } = params;

  switch (schoolType) {
    case 'gy':
      return getProgramStatisticsGY(otherParams);
    case 'gyan':
      return getProgramStatisticsGYAN(otherParams);
    default:
      return {
        content: [
          {
            type: 'text' as const,
            text: `Ogiltig skoltyp för programstatistik: ${schoolType}. Välj mellan gy eller gyan.`
          }
        ],
        isError: true
      };
  }
}

// ===== CONSOLIDATED EDUCATION EVENTS =====

export const searchEducationEventsSchema = {
  format: z.enum(['full', 'compact']).describe(
    'Format: full (full information) eller compact (kompakt format med mindre detaljer)'
  ),
  name: z.string().optional().describe('Namn på utbildningsevent'),
  schoolUnitCode: z.string().optional().describe('Skolenhetskod (8 siffror)'),
  municipality: z.string().optional().describe('Kommunnamn'),
  municipalityCode: z.string().optional().describe('Kommunkod'),
  county: z.string().optional().describe('Länsnamn'),
  countyCode: z.string().optional().describe('Länskod'),
  programCode: z.string().optional().describe('Programkod'),
  orientationCode: z.string().optional().describe('Inriktningskod'),
  adultTypeOfSchooling: z.string().optional().describe('Vuxenutbildningstyp'),
  instructionLanguage: z.string().optional().describe('Undervisningsspråk'),
  distanceStudyType: z.string().optional().describe('Distansstudietyp'),
  page: z.number().optional().describe('Sidnummer (1-baserad)'),
  size: z.number().optional().describe('Antal resultat per sida (max 500)')
};

export async function searchEducationEvents(params: {
  format: 'full' | 'compact';
  name?: string;
  schoolUnitCode?: string;
  municipality?: string;
  municipalityCode?: string;
  county?: string;
  countyCode?: string;
  programCode?: string;
  orientationCode?: string;
  adultTypeOfSchooling?: string;
  instructionLanguage?: string;
  distanceStudyType?: string;
  page?: number;
  size?: number;
}) {
  const { format, ...otherParams } = params;

  switch (format) {
    case 'full':
      return searchEducationEventsV4(otherParams);
    case 'compact':
      return searchCompactEducationEventsV4(otherParams);
    default:
      return {
        content: [
          {
            type: 'text' as const,
            text: `Ogiltigt format: ${format}. Välj mellan full eller compact.`
          }
        ],
        isError: true
      };
  }
}
