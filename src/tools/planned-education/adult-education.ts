/**
 * Verktyg för vuxenutbildning (Adult Education)
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// Zod-scheman för validering
export const searchAdultEducationSchema = {
  searchTerm: z.string().optional().describe('Sökterm för utbildningar'),
  town: z.string().optional().describe('Stad/Studieort (t.ex. "Stockholm", "Göteborg")'),
  county: z.string().optional().describe('Län'),
  municipality: z.string().optional().describe('Kommun'),
  typeOfSchool: z.string().optional().describe('Utbildningsform (t.ex. "yh" för Yrkeshögskola, "sfi" för SFI, "komvuxgycourses" för Komvux)'),
  distance: z.enum(['true', 'false']).optional().describe('Distansutbildning (true/false)'),
  paceOfStudy: z.string().optional().describe('Studietakt (t.ex. "100", "50", "25" eller intervall "50-100")'),
  semesterStartFrom: z.string().optional().describe('Terminstart från datum (format: YYYY-MM-DD)'),
  page: z.number().optional().default(0).describe('Sidnummer (0-index)'),
  size: z.number().optional().default(20).describe('Antal resultat per sida (max 100)')
};

export const getAdultEducationDetailsSchema = {
  id: z.string().describe('Utbildningstillfällets ID')
};

export const filterAdultEducationByDistanceSchema = {
  distance: z.boolean().describe('true för distansutbildningar, false för campus'),
  searchTerm: z.string().optional().describe('Ytterligare sökterm'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal resultat per sida')
};

export const filterAdultEducationByPaceSchema = {
  paceOfStudy: z.string().describe('Studietakt (t.ex. "100" för heltid, "50" för halvtid)'),
  searchTerm: z.string().optional().describe('Ytterligare sökterm'),
  page: z.number().optional().default(0).describe('Sidnummer'),
  size: z.number().optional().default(20).describe('Antal resultat per sida')
};

// Verktygsimplementationer
export async function searchAdultEducation(params: {
  searchTerm?: string;
  town?: string;
  county?: string;
  municipality?: string;
  typeOfSchool?: string;
  distance?: 'true' | 'false';
  paceOfStudy?: string;
  semesterStartFrom?: string;
  page?: number;
  size?: number;
}) {
  try {
    const response = await plannedEducationApi.searchAdultEducation(params);

    if (response.status !== 'OK') {
      throw new Error(response.message || 'Okänt fel från API');
    }

    const events = response.body._embedded.listedAdultEducationEvents;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalResults: response.body.page?.totalElements || events.length,
            currentPage: response.body.page?.number || 0,
            totalPages: response.body.page?.totalPages || 1,
            showing: events.length,
            educationEvents: events.map(event => ({
              id: event.educationEventId,
              title: event.titleSv,
              provider: event.providerName,
              municipality: event.municipality,
              county: event.county,
              town: event.town,
              typeOfSchool: event.typeOfSchool,
              distance: event.distance,
              paceOfStudy: event.paceOfStudy,
              semesterStart: event.semesterStartFrom,
              credits: event.credits
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
          text: `Fel vid sökning av vuxenutbildningar: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getAdultEducationDetails(params: {
  id: string;
}) {
  try {
    const response = await plannedEducationApi.getAdultEducationDetails(params.id);

    if (response.status !== 'OK') {
      throw new Error(response.message || 'Okänt fel från API');
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(response.body, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av utbildningsdetaljer: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function filterAdultEducationByDistance(params: {
  distance: boolean;
  searchTerm?: string;
  page?: number;
  size?: number;
}) {
  try {
    const response = await plannedEducationApi.searchAdultEducation({
      distance: params.distance ? 'true' : 'false',
      searchTerm: params.searchTerm,
      page: params.page,
      size: params.size
    });

    if (response.status !== 'OK') {
      throw new Error(response.message || 'Okänt fel från API');
    }

    const events = response.body._embedded.listedAdultEducationEvents;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            filter: params.distance ? 'Endast distansutbildningar' : 'Endast campus-utbildningar',
            totalResults: response.body.page?.totalElements || events.length,
            showing: events.length,
            educationEvents: events.map(event => ({
              id: event.educationEventId,
              title: event.titleSv,
              provider: event.providerName,
              distance: event.distance,
              municipality: event.municipality
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
          text: `Fel vid filtrering av distansutbildningar: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function filterAdultEducationByPace(params: {
  paceOfStudy: string;
  searchTerm?: string;
  page?: number;
  size?: number;
}) {
  try {
    const response = await plannedEducationApi.searchAdultEducation({
      paceOfStudy: params.paceOfStudy,
      searchTerm: params.searchTerm,
      page: params.page,
      size: params.size
    });

    if (response.status !== 'OK') {
      throw new Error(response.message || 'Okänt fel från API');
    }

    const events = response.body._embedded.listedAdultEducationEvents;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            paceFilter: params.paceOfStudy,
            totalResults: response.body.page?.totalElements || events.length,
            showing: events.length,
            educationEvents: events.map(event => ({
              id: event.educationEventId,
              title: event.titleSv,
              provider: event.providerName,
              paceOfStudy: event.paceOfStudy,
              municipality: event.municipality
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
          text: `Fel vid filtrering efter studietakt: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
