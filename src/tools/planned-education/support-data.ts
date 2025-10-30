/**
 * Verktyg för stöddata - områden, inriktningar, etc.
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// Zod-scheman för validering
export const getEducationAreasSchema = {};
export const getDirectionsSchema = {};

// Verktygsimplementationer
export async function getEducationAreas() {
  try {
    const response = await plannedEducationApi.getEducationAreas();

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
          text: `Fel vid hämtning av utbildningsområden: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getDirections() {
  try {
    const response = await plannedEducationApi.getDirections();

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
          text: `Fel vid hämtning av inriktningar: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
