/**
 * Verktyg för att söka och filtrera skolenheter
 */

import { z } from 'zod';
import { schoolUnitsApi } from '../../api/school-units-client.js';

// Zod-scheman för validering
export const searchSchoolUnitsSchema = {
  name: z.string().optional().describe('Sök efter skolenhet med namn (delmatchning)'),
  status: z.enum(['AKTIV', 'UPPHORT', 'VILANDE']).optional().describe('Filtrera på status (AKTIV, UPPHORT, VILANDE)'),
  limit: z.number().optional().default(50).describe('Maximalt antal resultat att returnera')
};

export const getSchoolUnitDetailsSchema = {
  code: z.string().describe('Skolenhetskod (t.ex. "29824923")')
};

export const getSchoolUnitsByStatusSchema = {
  status: z.enum(['AKTIV', 'UPPHORT', 'VILANDE']).describe('Status att filtrera på'),
  limit: z.number().optional().default(50).describe('Maximalt antal resultat att returnera')
};

export const searchSchoolUnitsByNameSchema = {
  name: z.string().describe('Namn eller del av namn att söka efter'),
  limit: z.number().optional().default(50).describe('Maximalt antal resultat att returnera')
};

// Verktygsimplementationer
export async function searchSchoolUnits(params: {
  name?: string;
  status?: 'AKTIV' | 'UPPHORT' | 'VILANDE';
  limit?: number;
}) {
  try {
    const units = await schoolUnitsApi.searchSchoolUnits({
      name: params.name,
      status: params.status
    });

    // Begränsa antal resultat
    const limitedUnits = params.limit ? units.slice(0, params.limit) : units.slice(0, 50);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalFound: units.length,
            showing: limitedUnits.length,
            schoolUnits: limitedUnits
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

export async function getSchoolUnitDetails(params: {
  code: string;
}) {
  try {
    const unit = await schoolUnitsApi.getSchoolUnit(params.code);

    if (!unit) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Ingen skolenhet hittades med kod: ${params.code}`
          }
        ],
        isError: true
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(unit, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av skolenhet: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function getSchoolUnitsByStatus(params: {
  status: 'AKTIV' | 'UPPHORT' | 'VILANDE';
  limit?: number;
}) {
  try {
    const units = await schoolUnitsApi.getSchoolUnitsByStatus(params.status);

    // Begränsa antal resultat
    const limitedUnits = params.limit ? units.slice(0, params.limit) : units.slice(0, 50);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            status: params.status,
            totalFound: units.length,
            showing: limitedUnits.length,
            schoolUnits: limitedUnits
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av skolenheter efter status: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

export async function searchSchoolUnitsByName(params: {
  name: string;
  limit?: number;
}) {
  try {
    const units = await schoolUnitsApi.searchSchoolUnitsByName(params.name);

    // Begränsa antal resultat
    const limitedUnits = params.limit ? units.slice(0, params.limit) : units.slice(0, 50);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            searchTerm: params.name,
            totalFound: units.length,
            showing: limitedUnits.length,
            schoolUnits: limitedUnits
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid sökning av skolenheter efter namn: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
