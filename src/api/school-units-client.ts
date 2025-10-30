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
      customAcceptHeader: 'application/vnd.skolverket.plannededucations.api.v3.hal+json'
    });
  }

  /**
   * Hämta alla skolenheter (använder compact-school-units endpoint)
   */
  async getAllSchoolUnits(): Promise<any> {
    return this.get<any>('/v3/compact-school-units', { size: 100 }); // Minskad size för att undvika timeouts
  }

  /**
   * Hämta skolenheter med filtrering (client-side)
   * OBS: API:et stödjer inte server-side filtrering, så vi hämtar allt och filtrerar lokalt
   */
  async searchSchoolUnits(params: SchoolUnitsSearchParams = {}): Promise<any[]> {
    const response = await this.getAllSchoolUnits();
    let units = response.body?._embedded?.compactSchoolUnits || [];

    // Filtrera på namn (case-insensitive)
    if (params.name) {
      const searchTerm = params.name.toLowerCase();
      units = units.filter((unit: any) =>
        unit.schoolUnitName.toLowerCase().includes(searchTerm)
      );
    }

    // OBS: status-filtrering stöds inte längre i compact-school-units (alla är aktiva)

    return units;
  }

  /**
   * Hämta en specifik skolenhet baserat på kod
   */
  async getSchoolUnit(code: string): Promise<any | undefined> {
    const response = await this.getAllSchoolUnits();
    const units = response.body?._embedded?.compactSchoolUnits || [];
    return units.find((unit: any) => unit.schoolUnitCode === code);
  }

  /**
   * Hämta skolenheter efter status
   * OBS: compact-school-units returnerar bara aktiva enheter
   */
  async getSchoolUnitsByStatus(status: string): Promise<any[]> {
    // Alla enheter i compact-school-units är aktiva
    return status === 'AKTIV' ? this.searchSchoolUnits() : [];
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
