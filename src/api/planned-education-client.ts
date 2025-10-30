/**
 * API-klient för Planned Educations API
 */

import { BaseApiClient } from './base-client.js';
import { config } from '../config.js';
import type {
  ApiResponse,
  AdultEducationEvent,
  AdultEducationResponse,
  AdultEducationSearchParams,
  PlannedSchoolUnit,
  SchoolUnitCompactResponse,
  EducationEvent,
  SchoolStatistics,
  StatisticsResponse,
  InspectionDocument,
  DocumentsResponse,
  SchoolSurveyData,
  SchoolSurveyResponse,
  SupportDataResponse
} from '../types/planned-education.js';

export class PlannedEducationApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: config.plannedEducationApiBaseUrl,
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
   * Vuxenutbildning (Adult Education)
   */

  async searchAdultEducation(params: AdultEducationSearchParams = {}): Promise<ApiResponse<AdultEducationResponse>> {
    // Sätt defaults
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<ApiResponse<AdultEducationResponse>>('/v3/adult-education-events', searchParams);
  }

  async getAdultEducationDetails(id: string): Promise<ApiResponse<AdultEducationEvent>> {
    return this.get<ApiResponse<AdultEducationEvent>>(`/v3/adult-education-events/${id}`);
  }

  /**
   * Skolenheter (School Units)
   */

  async searchSchoolUnits(params: any = {}): Promise<ApiResponse<SchoolUnitCompactResponse>> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<ApiResponse<SchoolUnitCompactResponse>>('/v3/compact-school-units', searchParams);
  }

  async getSchoolUnitDetails(code: string): Promise<ApiResponse<PlannedSchoolUnit>> {
    return this.get<ApiResponse<PlannedSchoolUnit>>(`/v3/school-units/${code}`);
  }

  /**
   * Utbildningstillfällen (Education Events) - Gymnasiet
   */

  async searchEducationEvents(params: any = {}): Promise<ApiResponse<any>> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<ApiResponse<any>>('/v3/education-events', searchParams);
  }

  async getEducationEventDetails(id: string): Promise<ApiResponse<EducationEvent>> {
    return this.get<ApiResponse<EducationEvent>>(`/v3/education-events/${id}`);
  }

  /**
   * Statistik (Statistics)
   */

  async getSchoolStatistics(schoolUnitCode: string, params: any = {}): Promise<ApiResponse<StatisticsResponse>> {
    return this.get<ApiResponse<StatisticsResponse>>(`/v3/school-units/${schoolUnitCode}/statistics`, params);
  }

  async getMunicipalityStatistics(municipalityCode: string, params: any = {}): Promise<ApiResponse<StatisticsResponse>> {
    return this.get<ApiResponse<StatisticsResponse>>(`/v3/statistics/municipalities/${municipalityCode}`, params);
  }

  /**
   * Dokument (Documents) - Inspektionsrapporter
   */

  async searchInspectionDocuments(params: any = {}): Promise<ApiResponse<DocumentsResponse>> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<ApiResponse<DocumentsResponse>>('/v3/documents', searchParams);
  }

  async getDocumentDetails(id: string): Promise<ApiResponse<InspectionDocument>> {
    return this.get<ApiResponse<InspectionDocument>>(`/v3/documents/${id}`);
  }

  /**
   * Skolenkät (School Survey)
   */

  async getSchoolSurveyData(schoolUnitCode: string, params: any = {}): Promise<ApiResponse<SchoolSurveyResponse>> {
    return this.get<ApiResponse<SchoolSurveyResponse>>(`/v3/school-units/${schoolUnitCode}/surveys`, params);
  }

  /**
   * Stöddata (Support Data)
   */

  async getEducationAreas(): Promise<ApiResponse<SupportDataResponse>> {
    return this.get<ApiResponse<SupportDataResponse>>('/v3/support/geographical-areas');
  }

  async getDirections(): Promise<ApiResponse<SupportDataResponse>> {
    return this.get<ApiResponse<SupportDataResponse>>('/v3/support/programs');
  }
}

// Singleton-instans
export const plannedEducationApi = new PlannedEducationApiClient();
