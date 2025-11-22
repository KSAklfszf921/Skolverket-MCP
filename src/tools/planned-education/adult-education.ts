/**
 * Verktyg för vuxenutbildning (Adult Education)
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// Zod-scheman för validering
export const searchAdultEducationSchema = {
  searchTerm: z.string().optional().describe('Sökterm för utbildningar'),
  town: z.string().optional().describe('Städer/Studieort(er) ex. Solna,Göteborg'),
  executionCondition: z.string().optional().describe('Kod som beskriver när kurs startar (0 = Ej fastställt, 1 = Datum satt, 2,3 = Löpande kursstart)'),
  geographicalAreaCode: z.string().optional().describe('Områdeskod (kommun- eller länskod)'),
  instructionLanguages: z.string().optional().describe('De språk kursen leds på'),
  directionIds: z.string().optional().describe('Inriktning(ar), tillgängliga inriktningar hittar du under endpoint: /v4/adult-education-events/areas'),
  county: z.string().optional().describe('Län'),
  municipality: z.string().optional().describe('Kommun(er)'),
  typeOfSchool: z.string().optional().describe('Utbildningsform (ex. forutbildning, coursebasic, courseadvanced, programbasic, kku (konstkultur), programadvanced, fhs (fhsk), vuxgy (komvuxgycourses), vuxgr (komvuxbasiccourses), komvuxcoursepackage, sfi, vuxgyan (komvuxgysar), vuxgran (komvuxgrsar), aub (arbmarknutb), fhsaub (fhskaub), forberutb, testokartl, yh, ny, yhkurskurspaket, yhprogram, vuxsfi (komvuxsfi))'),
  distance: z.enum(['true', 'false']).optional().describe('Distansutbildning kan vara true, false eller lämnas tom för att få allt'),
  paceOfStudy: z.string().optional().describe('Studietakt, ex: 25,50,100 eller 25 eller 50, 100 eller 0-25, 25-75, 0-100 osv (separera med , eller ; eller :)'),
  semesterStartFrom: z.string().optional().describe('Terminstart, ex: 2020-01-01TO2020-05-31,2020-08-01TO2020-12-31'),
  recommendedPriorKnowledge: z.string().optional().describe('Utbildningar som bara kräver grundläggande behörighet kan vara grundlaggande eller lämnas tomt'),
  sort: z.string().optional().describe('Sorteringsordning kan kombineras t.ex. titleSv:asc, typeOfSchool:desc, municipality:desc'),
  page: z.number().optional().default(0).describe('Sidnummer att starta hämtning från (max 999999999)'),
  size: z.number().optional().default(20).describe('Antal träffar per sida (max 200)')
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
  executionCondition?: string;
  geographicalAreaCode?: string;
  instructionLanguages?: string;
  directionIds?: string;
  county?: string;
  municipality?: string;
  typeOfSchool?: string;
  distance?: 'true' | 'false';
  paceOfStudy?: string;
  semesterStartFrom?: string;
  recommendedPriorKnowledge?: string;
  sort?: string;
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
