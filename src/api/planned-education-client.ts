/**
 * API-klient för Planned Educations API
 */

import { BaseApiClient } from './base-client.js';
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
      baseURL: 'https://api.skolverket.se/planned-educations',
      userAgent: 'skolverket-mcp/2.0.0'
    });

    // Lägg till header för API-version (v4 är senaste)
    this.client.defaults.headers['Accept'] = 'application/vnd.skolverket.plannededucations.api.v4.hal+json';
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

    return this.get<ApiResponse<AdultEducationResponse>>('/adult-education-events', searchParams);
  }

  async getAdultEducationDetails(id: string): Promise<ApiResponse<AdultEducationEvent>> {
    return this.get<ApiResponse<AdultEducationEvent>>(`/adult-education-events/${id}`);
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

    return this.get<ApiResponse<SchoolUnitCompactResponse>>('/school-units', searchParams);
  }

  async getSchoolUnitDetails(code: string): Promise<ApiResponse<PlannedSchoolUnit>> {
    return this.get<ApiResponse<PlannedSchoolUnit>>(`/school-units/${code}`);
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

    return this.get<ApiResponse<any>>('/education-events', searchParams);
  }

  async getEducationEventDetails(id: string): Promise<ApiResponse<EducationEvent>> {
    return this.get<ApiResponse<EducationEvent>>(`/education-events/${id}`);
  }

  /**
   * Statistik (Statistics)
   */

  async getSchoolStatistics(schoolUnitCode: string, params: any = {}): Promise<ApiResponse<StatisticsResponse>> {
    return this.get<ApiResponse<StatisticsResponse>>(`/statistics/school-units/${schoolUnitCode}`, params);
  }

  async getMunicipalityStatistics(municipalityCode: string, params: any = {}): Promise<ApiResponse<StatisticsResponse>> {
    return this.get<ApiResponse<StatisticsResponse>>(`/statistics/municipalities/${municipalityCode}`, params);
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

    return this.get<ApiResponse<DocumentsResponse>>('/documents', searchParams);
  }

  async getDocumentDetails(id: string): Promise<ApiResponse<InspectionDocument>> {
    return this.get<ApiResponse<InspectionDocument>>(`/documents/${id}`);
  }

  /**
   * Skolenkät (School Survey)
   */

  async getSchoolSurveyData(schoolUnitCode: string, params: any = {}): Promise<ApiResponse<SchoolSurveyResponse>> {
    return this.get<ApiResponse<SchoolSurveyResponse>>(`/school-survey/${schoolUnitCode}`, params);
  }

  /**
   * Stöddata (Support Data)
   */

  async getEducationAreas(): Promise<ApiResponse<SupportDataResponse>> {
    return this.get<ApiResponse<SupportDataResponse>>('/support-data/areas');
  }

  async getDirections(): Promise<ApiResponse<SupportDataResponse>> {
    return this.get<ApiResponse<SupportDataResponse>>('/support-data/directions');
  }
}

// Singleton-instans
export const plannedEducationApi = new PlannedEducationApiClient();
