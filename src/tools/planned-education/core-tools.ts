/**
 * Core Planned Education verktyg för HTTP MCP Server
 * Fas 1: Essential education events och counting tools
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// ===== SEARCH EDUCATION EVENTS =====

export const searchEducationEventsSchema = {
  schoolUnitCode: z.string().optional().describe('Filtrera på skolenhetskod'),
  typeOfSchool: z.string().optional().describe('Typ av skola (t.ex. gy)'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  distance: z.boolean().optional().describe('Distansutbildning (true/false)'),
  paceOfStudy: z.string().optional().describe('Studietakt (t.ex. 100)'),
  programCode: z.string().optional().describe('Programkod (t.ex. NA för Naturvetenskap)'),
  searchTerm: z.string().optional().describe('Fritextsökning'),
  page: z.number().optional().default(0).describe('Sidnummer (0-indexerat)'),
  size: z.number().optional().default(20).describe('Antal resultat per sida (max 100)'),
  limit: z.number().optional().default(50).describe('Max antal resultat att returnera totalt (max 200)')
};

export async function searchEducationEvents(params: {
  schoolUnitCode?: string;
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  distance?: boolean;
  paceOfStudy?: string;
  programCode?: string;
  searchTerm?: string;
  page?: number;
  size?: number;
  limit?: number;
}) {
  try {
    // Begränsa size för att undvika stora responses
    const pageSize = Math.min(params.size || 20, 100);
    const maxResults = Math.min(params.limit || 50, 200);

    const result = await plannedEducationApi.searchEducationEventsV4({
      ...params,
      size: pageSize
    });

    const events = result._embedded?.educationEvents || [];
    const limitedEvents = events.slice(0, maxResults);
    const totalElements = result.page?.totalElements || events.length;
    const hasMore = totalElements > maxResults;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalElements,
            returned: limitedEvents.length,
            hasMore,
            message: hasMore ? `Visar ${limitedEvents.length} av ${totalElements} utbildningstillfällen. Använd fler filter för att begränsa resultatet.` : undefined,
            events: limitedEvents.map((e: any) => ({
              educationEventId: e.educationEventId,
              schoolUnitCode: e.schoolUnitCode,
              schoolUnitName: e.schoolUnitName,
              municipality: e.municipality,
              county: e.county,
              programCode: e.programCode,
              programName: e.programName,
              orientationCode: e.orientationCode,
              orientationName: e.orientationName,
              distance: e.distance,
              paceOfStudy: e.paceOfStudy,
              semesterStartFrom: e.semesterStartFrom
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
          text: `Fel vid sökning av utbildningstillfällen: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== COUNT EDUCATION EVENTS =====

export const countEducationEventsSchema = {
  typeOfSchool: z.string().optional().describe('Typ av skola'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  programCode: z.string().optional().describe('Programkod'),
  distance: z.boolean().optional().describe('Distansutbildning')
};

export async function countEducationEvents(params: {
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  programCode?: string;
  distance?: boolean;
}) {
  try {
    const result = await plannedEducationApi.countEducationEventsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            count: result.count,
            message: `Hittade ${result.count} gymnasieutbildningar som matchar filtren.`
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid räkning av utbildningstillfällen: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== COUNT ADULT EDUCATION EVENTS =====

export const countAdultEducationEventsSchema = {
  typeOfSchool: z.string().optional().describe('Typ av vuxenutbildning (t.ex. yh, sfi, komvuxgycourses)'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  distance: z.string().optional().describe('Distansutbildning (true/false)'),
  searchTerm: z.string().optional().describe('Fritextsökning')
};

export async function countAdultEducationEvents(params: {
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  distance?: string;
  searchTerm?: string;
}) {
  try {
    const result = await plannedEducationApi.countAdultEducationEventsV4(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            count: result.count,
            message: `Hittade ${result.count} vuxenutbildningar som matchar filtren.`
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid räkning av vuxenutbildningar: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

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
            areas: result.areas?.map((area: any) => ({
              areaId: area.areaId,
              name: area.name,
              nameEn: area.nameEn,
              directions: area.directions?.map((dir: any) => ({
                directionId: dir.directionId,
                name: dir.name,
                nameEn: dir.nameEn
              }))
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
          text: `Fel vid hämtning av utbildningsområden: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== SEARCH SCHOOL UNITS V4 (ENHANCED) =====

export const searchSchoolUnitsV4Schema = {
  name: z.string().optional().describe('Skolenhetens namn eller del av namn'),
  municipality: z.string().optional().describe('Kommun'),
  county: z.string().optional().describe('Län'),
  typeOfSchool: z.string().optional().describe('Skolform (t.ex. gy, gr, fsk)'),
  principalOrganizer: z.string().optional().describe('Huvudman'),
  status: z.string().optional().describe('Status (AKTIV, UPPHORT, VILANDE)'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida (max 100)'),
  limit: z.number().optional().default(50).describe('Max antal resultat totalt (max 200)')
};

export async function searchSchoolUnitsV4(params: {
  name?: string;
  municipality?: string;
  county?: string;
  typeOfSchool?: string;
  principalOrganizer?: string;
  status?: string;
  page?: number;
  size?: number;
  limit?: number;
}) {
  try {
    const pageSize = Math.min(params.size || 20, 100);
    const maxResults = Math.min(params.limit || 50, 200);

    const result = await plannedEducationApi.searchSchoolUnitsV4({
      ...params,
      size: pageSize
    });

    const units = result._embedded?.schoolUnits || [];
    const limitedUnits = units.slice(0, maxResults);
    const totalElements = result.page?.totalElements || units.length;
    const hasMore = totalElements > maxResults;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalElements,
            returned: limitedUnits.length,
            hasMore,
            message: hasMore ? `Visar ${limitedUnits.length} av ${totalElements} skolenheter. Använd fler filter för att begränsa.` : undefined,
            schoolUnits: limitedUnits.map((u: any) => ({
              schoolUnitCode: u.schoolUnitCode,
              schoolUnitName: u.schoolUnitName,
              municipality: u.municipality,
              county: u.county,
              typeOfSchool: u.typeOfSchool,
              principalOrganizer: u.principalOrganizer,
              status: u.status
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
          text: `Fel vid sökning av skolenheter: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET SCHOOL UNIT EDUCATION EVENTS =====

export const getSchoolUnitEducationEventsSchema = {
  code: z.string().describe('Skolenhetskod (8 siffror)'),
  programCode: z.string().optional().describe('Filtrera på programkod'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal per sida (max 100)'),
  limit: z.number().optional().default(50).describe('Max antal resultat (max 200)')
};

export async function getSchoolUnitEducationEvents(params: {
  code: string;
  programCode?: string;
  page?: number;
  size?: number;
  limit?: number;
}) {
  try {
    const pageSize = Math.min(params.size || 20, 100);
    const maxResults = Math.min(params.limit || 50, 200);

    const result = await plannedEducationApi.getSchoolUnitEducationEvents(params.code, {
      programCode: params.programCode,
      page: params.page,
      size: pageSize
    });

    const events = result._embedded?.educationEvents || [];
    const limitedEvents = events.slice(0, maxResults);
    const totalElements = result.page?.totalElements || events.length;
    const hasMore = totalElements > maxResults;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolUnitCode: params.code,
            totalElements,
            returned: limitedEvents.length,
            hasMore,
            message: hasMore ? `Visar ${limitedEvents.length} av ${totalElements} utbildningar på denna skola.` : undefined,
            events: limitedEvents.map((e: any) => ({
              educationEventId: e.educationEventId,
              programCode: e.programCode,
              programName: e.programName,
              orientationCode: e.orientationCode,
              orientationName: e.orientationName,
              distance: e.distance,
              paceOfStudy: e.paceOfStudy,
              semesterStartFrom: e.semesterStartFrom
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
          text: `Fel vid hämtning av skolenhetens utbildningar: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
