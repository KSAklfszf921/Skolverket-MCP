/**
 * Support verktyg för Planned Education API
 * Fas 2: Support data (metadata)
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// ===== GET SCHOOL TYPES V4 =====

export const getSchoolTypesV4Schema = {};

export async function getSchoolTypesV4() {
  try {
    const result = await plannedEducationApi.getSchoolTypesV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            schoolTypes: result.schoolTypes?.map((type: any) => ({
              code: type.code,
              name: type.name,
              description: type.description
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
          text: `Fel vid hämtning av skoltyper: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET GEOGRAPHICAL AREAS V4 =====

export const getGeographicalAreasV4Schema = {};

export async function getGeographicalAreasV4() {
  try {
    const result = await plannedEducationApi.getGeographicalAreasV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            geographicalAreas: result
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av geografiska områden: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GET PROGRAMS V4 =====

export const getProgramsV4Schema = {};

export async function getProgramsV4() {
  try {
    const result = await plannedEducationApi.getProgramsV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            programs: result.programs?.map((program: any) => ({
              code: program.code,
              name: program.name,
              typeOfProgram: program.typeOfProgram,
              orientations: program.orientations?.map((or: any) => ({
                code: or.code,
                name: or.name
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
          text: `Fel vid hämtning av gymnasieprogram: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
