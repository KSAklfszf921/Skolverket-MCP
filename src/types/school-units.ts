/**
 * TypeScript-typer för Skolenhetsregistret API
 */

// Metadata
export interface SchoolUnitsMetadata {
  extractDate: string; // ISO 8601 format
}

// Skolenhet
export interface SchoolUnit {
  schoolUnitCode: string;
  name: string;
  status: 'AKTIV' | 'UPPHORT' | 'VILANDE' | 'PLANERAD'; // Enligt v2 API spec
}

// API Response
export interface SchoolUnitsResponse {
  meta: SchoolUnitsMetadata;
  data: {
    type: 'schoolunit';
    attributes: SchoolUnit[];
  };
}

// Sökparametrar
export interface SchoolUnitsSearchParams {
  status?: 'AKTIV' | 'UPPHORT' | 'VILANDE' | 'PLANERAD'; // Enligt v2 API spec
  name?: string;
  municipality?: string;
  county?: string;
}
