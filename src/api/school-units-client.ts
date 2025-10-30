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
      authHeader: config.authHeader
      // Ta bort customAcceptHeader - använd standard application/json för v2 API
    });
  }

  /**
   * Hämta alla skolenheter (använder v2 school-units endpoint enligt officiell API-spec)
   */
  async getAllSchoolUnits(): Promise<any> {
    return this.get<any>('/v2/school-units'); // Använder v2 enligt officiell Skolenhetsregistret API spec
  }

  /**
   * Hämta skolenheter med filtrering (client-side)
   * v2 API:et returnerar data i format: { data: { attributes: [...] } }
   */
  async searchSchoolUnits(params: SchoolUnitsSearchParams = {}): Promise<any[]> {
    const response = await this.getAllSchoolUnits();
    let units = response.data?.attributes || [];

    // Filtrera på namn (case-insensitive)
    if (params.name) {
      const searchTerm = params.name.toLowerCase();
      units = units.filter((unit: any) =>
        unit.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrera på status (enligt v2 API spec: AKTIV, VILANDE, UPPHORT, PLANERAD)
    if (params.status) {
      units = units.filter((unit: any) => unit.status === params.status);
    }

    return units;
  }

  /**
   * Hämta en specifik skolenhet baserat på kod
   * v2 API:et har en dedikerad endpoint för detta: /v2/school-units/{schoolUnitCode}
   */
  async getSchoolUnit(code: string): Promise<any | undefined> {
    try {
      const response = await this.get<any>(`/v2/school-units/${code}`);
      return response.data?.attributes;
    } catch (error) {
      // Om direkt hämtning misslyckas, sök genom alla enheter
      const response = await this.getAllSchoolUnits();
      const units = response.data?.attributes || [];
      return units.find((unit: any) => unit.schoolUnitCode === code);
    }
  }

  /**
   * Hämta skolenheter efter status
   * v2 API:et stöder status: AKTIV, VILANDE, UPPHORT, PLANERAD
   */
  async getSchoolUnitsByStatus(status: 'AKTIV' | 'UPPHORT' | 'VILANDE' | 'PLANERAD'): Promise<any[]> {
    return this.searchSchoolUnits({ status });
  }

  /**
   * Sök skolenheter efter namn
   */
  async searchSchoolUnitsByName(name: string): Promise<any[]> {
    return this.searchSchoolUnits({ name });
  }
}

// Singleton-instans
export const schoolUnitsApi = new SchoolUnitsApiClient();
