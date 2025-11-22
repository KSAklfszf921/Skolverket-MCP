/**
 * V4 Verktyg för utbildningstillfällen (education events)
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// ===== SEARCH EDUCATION EVENTS V4 =====

export const searchEducationEventsV4Schema = {
  schoolUnitCode: z.string().optional().describe('Filtrera på skolenhetskod'),
  typeOfSchool: z.string().optional().describe('Typ av skola'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  geographicalAreaCode: z.string().optional().describe('Geografisk områdeskod'),
  distance: z.boolean().optional().describe('Distansutbildning (true/false)'),
  paceOfStudy: z.string().optional().describe('Studietakt'),
  semesterStartFrom: z.string().optional().describe('Terminsstart från datum (YYYY-MM-DD)'),
  programCode: z.string().optional().describe('Programkod'),
  orientationCode: z.string().optional().describe('Inriktningskod'),
  educationAreaCode: z.string().optional().describe('Utbildningsområdeskod'),
  directionIds: z.string().optional().describe('Inriktnings-ID (kommaseparerad lista)'),
  instructionLanguages: z.string().optional().describe('Undervisningsspråk (kommaseparerad lista)'),
  searchTerm: z.string().optional().describe('Fritextsökning'),
  page: z.number().optional().default(0).describe('Sidnummer (0-indexerat)'),
  size: z.number().optional().default(20).describe('Antal resultat per sida'),
  sort: z.string().optional().describe('Sortering (t.ex. "titleSv,asc")')
};

export async function searchEducationEventsV4(params: {
  schoolUnitCode?: string;
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  geographicalAreaCode?: string;
  distance?: boolean;
  paceOfStudy?: string;
  semesterStartFrom?: string;
  programCode?: string;
  orientationCode?: string;
  educationAreaCode?: string;
  directionIds?: string;
  instructionLanguages?: string;
  searchTerm?: string;
  page?: number;
  size?: number;
  sort?: string;
}) {
  try {
    const result = await plannedEducationApi.searchEducationEventsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            page: result.page,
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
          text: `Fel vid sökning av utbildningstillfällen (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SEARCH COMPACT EDUCATION EVENTS V4 =====

export const searchCompactEducationEventsV4Schema = {
  schoolUnitCode: z.string().optional().describe('Filtrera på skolenhetskod'),
  typeOfSchool: z.string().optional().describe('Typ av skola'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  geographicalAreaCode: z.string().optional().describe('Geografisk områdeskod'),
  distance: z.boolean().optional().describe('Distansutbildning (true/false)'),
  paceOfStudy: z.string().optional().describe('Studietakt'),
  semesterStartFrom: z.string().optional().describe('Terminsstart från datum (YYYY-MM-DD)'),
  searchTerm: z.string().optional().describe('Fritextsökning'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida')
};

export async function searchCompactEducationEventsV4(params: {
  schoolUnitCode?: string;
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  geographicalAreaCode?: string;
  distance?: boolean;
  paceOfStudy?: string;
  semesterStartFrom?: string;
  searchTerm?: string;
  page?: number;
  size?: number;
}) {
  try {
    const result = await plannedEducationApi.searchCompactEducationEventsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            page: result.page,
            compactEducationEvents: result._embedded.compactEducationEvents,
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
          text: `Fel vid sökning av kompakta utbildningstillfällen (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== COUNT EDUCATION EVENTS V4 =====

export const countEducationEventsV4Schema = {
  schoolUnitCode: z.string().optional().describe('Filtrera på skolenhetskod'),
  typeOfSchool: z.string().optional().describe('Typ av skola'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  geographicalAreaCode: z.string().optional().describe('Geografisk områdeskod'),
  distance: z.boolean().optional().describe('Distansutbildning'),
  paceOfStudy: z.string().optional().describe('Studietakt'),
  programCode: z.string().optional().describe('Programkod'),
  searchTerm: z.string().optional().describe('Fritextsökning')
};

export async function countEducationEventsV4(params: {
  schoolUnitCode?: string;
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  geographicalAreaCode?: string;
  distance?: boolean;
  paceOfStudy?: string;
  programCode?: string;
  searchTerm?: string;
}) {
  try {
    const result = await plannedEducationApi.countEducationEventsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            count: result.count,
            filters: result.filters
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid räkning av utbildningstillfällen (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== COUNT ADULT EDUCATION EVENTS V4 =====

export const countAdultEducationEventsV4Schema = {
  town: z.string().optional().describe('Ort'),
  executionCondition: z.string().optional().describe('Genomförandevillkor'),
  geographicalAreaCode: z.string().optional().describe('Geografisk områdeskod'),
  searchTerm: z.string().optional().describe('Fritextsökning'),
  typeOfSchool: z.string().optional().describe('Typ av skola'),
  paceOfStudy: z.string().optional().describe('Studietakt'),
  county: z.string().optional().describe('Län'),
  municipality: z.string().optional().describe('Kommun'),
  distance: z.string().optional().describe('Distansutbildning (true/false)')
};

export async function countAdultEducationEventsV4(params: {
  town?: string;
  executionCondition?: string;
  geographicalAreaCode?: string;
  searchTerm?: string;
  typeOfSchool?: string;
  paceOfStudy?: string;
  county?: string;
  municipality?: string;
  distance?: string;
}) {
  try {
    const result = await plannedEducationApi.countAdultEducationEventsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            count: result.count,
            filters: result.filters
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid räkning av vuxenutbildningstillfällen (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
