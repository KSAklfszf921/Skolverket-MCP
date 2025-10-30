/**
 * API-klient för Skolenhetsregistret API
 */

import { BaseApiClient } from './base-client.js';
import { config } from '../config.js';
import type {
  SchoolUnitsResponse,
  SchoolUnit,
  SchoolUnitsSearchParams
} from '../types/school-units.js';

export class SchoolUnitsApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: config.schoolUnitsApiBaseUrl,
      userAgent: 'skolverket-mcp/2.1.0',
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
      maxConcurrent: config.maxConcurrent,
      apiKey: config.apiKey,
      authHeader: config.authHeader,
    });
  }

  /**
   * Hämta alla skolenheter
   */
  async getAllSchoolUnits(): Promise<SchoolUnitsResponse> {
    return this.get<SchoolUnitsResponse>('/school-units');
  }

  /**
   * Hämta skolenheter med filtrering (client-side)
   * OBS: API:et stödjer inte server-side filtrering, så vi hämtar allt och filtrerar lokalt
   */
  async searchSchoolUnits(params: SchoolUnitsSearchParams = {}): Promise<SchoolUnit[]> {
    const response = await this.getAllSchoolUnits();
    let units = response.data.attributes;

    // Filtrera på status
    if (params.status) {
      units = units.filter(unit => unit.status === params.status);
    }

    // Filtrera på namn (case-insensitive)
    if (params.name) {
      const searchTerm = params.name.toLowerCase();
      units = units.filter(unit =>
        unit.name.toLowerCase().includes(searchTerm)
      );
    }

    return units;
  }

  /**
   * Hämta en specifik skolenhet baserat på kod
   */
  async getSchoolUnit(code: string): Promise<SchoolUnit | undefined> {
    const response = await this.getAllSchoolUnits();
    return response.data.attributes.find(unit => unit.schoolUnitCode === code);
  }

  /**
   * Hämta skolenheter efter status
   */
  async getSchoolUnitsByStatus(status: 'AKTIV' | 'UPPHORT' | 'VILANDE'): Promise<SchoolUnit[]> {
    return this.searchSchoolUnits({ status });
  }

  /**
   * Sök skolenheter efter namn
   */
  async searchSchoolUnitsByName(name: string): Promise<SchoolUnit[]> {
    return this.searchSchoolUnits({ name });
  }
}

// Singleton-instans
export const schoolUnitsApi = new SchoolUnitsApiClient();
