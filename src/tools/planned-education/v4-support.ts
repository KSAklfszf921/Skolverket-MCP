/**
 * V4 Verktyg för stöddata (support data) - referensdata och uppslagsvärden
 */

import { z } from 'zod';
import { plannedEducationApi } from '../../api/planned-education-client.js';

// ===== SCHOOL TYPES V4 =====

export const getSchoolTypesV4Schema = {};

export async function getSchoolTypesV4() {
  try {
    const result = await plannedEducationApi.getSchoolTypesV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalSchoolTypes: result.schoolTypes.length,
            schoolTypes: result.schoolTypes
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av skoltyper (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== GEOGRAPHICAL AREAS V4 =====

export const getGeographicalAreasV4Schema = {};

export async function getGeographicalAreasV4() {
  try {
    const result = await plannedEducationApi.getGeographicalAreasV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalAreas: result.geographicalAreas.length,
            geographicalAreas: result.geographicalAreas
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av geografiska områden (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== PRINCIPAL ORGANIZER TYPES V4 =====

export const getPrincipalOrganizerTypesV4Schema = {};

export async function getPrincipalOrganizerTypesV4() {
  try {
    const result = await plannedEducationApi.getPrincipalOrganizerTypesV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalTypes: result.principalOrganizerTypes.length,
            principalOrganizerTypes: result.principalOrganizerTypes
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av huvudmanstyper (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== PROGRAMS V4 =====

export const getProgramsV4Schema = {};

export async function getProgramsV4() {
  try {
    const result = await plannedEducationApi.getProgramsV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalPrograms: result.programs.length,
            programs: result.programs
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av program (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== ORIENTATIONS V4 =====

export const getOrientationsV4Schema = {};

export async function getOrientationsV4() {
  try {
    const result = await plannedEducationApi.getOrientationsV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalOrientations: result.orientations.length,
            orientations: result.orientations
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av inriktningar (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== INSTRUCTION LANGUAGES V4 =====

export const getInstructionLanguagesV4Schema = {};

export async function getInstructionLanguagesV4() {
  try {
    const result = await plannedEducationApi.getInstructionLanguagesV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalLanguages: result.instructionLanguages.length,
            instructionLanguages: result.instructionLanguages
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av undervisningsspråk (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== DISTANCE STUDY TYPES V4 =====

export const getDistanceStudyTypesV4Schema = {};

export async function getDistanceStudyTypesV4() {
  try {
    const result = await plannedEducationApi.getDistanceStudyTypesV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalTypes: result.distanceStudyTypes.length,
            distanceStudyTypes: result.distanceStudyTypes
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av distansstudietyper (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== ADULT TYPE OF SCHOOLING V4 =====

export const getAdultTypeOfSchoolingV4Schema = {};

export async function getAdultTypeOfSchoolingV4() {
  try {
    const result = await plannedEducationApi.getAdultTypeOfSchoolingV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalTypes: result.adultTypeOfSchooling.length,
            adultTypeOfSchooling: result.adultTypeOfSchooling
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av vuxenutbildningstyper (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}

// ===== MUNICIPALITY SCHOOL UNITS V4 =====

export const getMunicipalitySchoolUnitsV4Schema = {};

export async function getMunicipalitySchoolUnitsV4() {
  try {
    const result = await plannedEducationApi.getMunicipalitySchoolUnitsV4();

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalMunicipalities: result.municipalities.length,
            municipalities: result.municipalities
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Fel vid hämtning av kommun-skolenhet-mappning (v4): ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
}
