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
  SupportDataResponse,
  // V4 types
  SchoolUnitV4,
  SchoolUnitV4Response,
  SchoolUnitDetailsV4,
  SchoolUnitSearchParamsV4,
  CompactEducationEvent,
  FullEducationEvent,
  CompactEducationEventsV4Response,
  EducationEventsV4Response,
  EducationEventsCountResponse,
  EducationEventSearchParamsV4,
  SchoolUnitStatisticsLinks,
  NationalStatisticsResponse,
  SALSAStatisticsResponse,
  ProgramStatisticsResponse,
  NestedSurveyResponse,
  FlatSurveyResponse,
  DocumentsV4Response,
  DistanceCalculation,
  SchoolTypesResponse,
  GeographicalAreasResponse,
  PrincipalOrganizerTypesResponse,
  ProgramsResponse,
  OrientationsResponse,
  InstructionLanguagesResponse,
  DistanceStudyTypesResponse,
  AdultTypeOfSchoolingResponse,
  MunicipalitySchoolUnitsResponse,
  // NYA V4 TYPES
  AdultEducationAreasResponse,
  ApiInfoV4Response,
  CompactSchoolUnitsV4Response,
  SecondarySchoolUnitsResponse,
  AllSchoolsSALSAResponse,
  SchoolUnitSALSAResponse,
  DocumentsByTypeResponse,
  EducationEventsByStudyPathResponse,
  SurveyByCategoryResponse
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

  /**
   * ===== V4 API METHODS =====
   */

  /**
   * V4 - School Units
   */

  async searchSchoolUnitsV4(params: SchoolUnitSearchParamsV4 = {}): Promise<SchoolUnitV4Response> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<SchoolUnitV4Response>('/v4/school-units', searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitDetailsV4(code: string): Promise<SchoolUnitDetailsV4> {
    return this.get<SchoolUnitDetailsV4>(`/v4/school-units/${code}`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitEducationEvents(code: string, params: EducationEventSearchParamsV4 = {}): Promise<EducationEventsV4Response> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<EducationEventsV4Response>(`/v4/school-units/${code}/education-events`, searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitCompactEducationEvents(code: string, params: EducationEventSearchParamsV4 = {}): Promise<CompactEducationEventsV4Response> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<CompactEducationEventsV4Response>(`/v4/school-units/${code}/compact-education-events`, searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async calculateDistanceFromSchoolUnit(code: string, latitude: number, longitude: number): Promise<DistanceCalculation> {
    return this.get<DistanceCalculation>(`/v4/school-units/${code}/distanceFrom`,
      { latitude, longitude },
      {
        headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
      }
    );
  }

  async getSchoolUnitDocuments(code: string, params: any = {}): Promise<DocumentsV4Response> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<DocumentsV4Response>(`/v4/school-units/${code}/documents`, searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsLinks(code: string): Promise<SchoolUnitStatisticsLinks> {
    return this.get<SchoolUnitStatisticsLinks>(`/v4/school-units/${code}/statistics`, undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsFSK(code: string, params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/fsk`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsGR(code: string, params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/gr`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsGRAN(code: string, params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/gran`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsGY(code: string, params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/gy`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitStatisticsGYAN(code: string, params: any = {}): Promise<any> {
    return this.get<any>(`/v4/school-units/${code}/statistics/gyan`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitSurveyNested(code: string, params: any = {}): Promise<NestedSurveyResponse> {
    return this.get<NestedSurveyResponse>(`/v4/school-units/${code}/surveys/nested`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitSurveyFlat(code: string, params: any = {}): Promise<FlatSurveyResponse> {
    return this.get<FlatSurveyResponse>(`/v4/school-units/${code}/surveys/flat`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  /**
   * V4 - Education Events
   */

  async searchEducationEventsV4(params: EducationEventSearchParamsV4 = {}): Promise<EducationEventsV4Response> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<EducationEventsV4Response>('/v4/education-events', searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async searchCompactEducationEventsV4(params: EducationEventSearchParamsV4 = {}): Promise<CompactEducationEventsV4Response> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<CompactEducationEventsV4Response>('/v4/compact-education-events', searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async countEducationEventsV4(params: EducationEventSearchParamsV4 = {}): Promise<EducationEventsCountResponse> {
    return this.get<EducationEventsCountResponse>('/v4/education-events/count', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  /**
   * V4 - Adult Education Events Count
   */

  async countAdultEducationEventsV4(params: any = {}): Promise<EducationEventsCountResponse> {
    return this.get<EducationEventsCountResponse>('/v4/adult-education-events/count', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  /**
   * V4 - Statistics
   */

  async getNationalStatisticsFSK(params: any = {}): Promise<NationalStatisticsResponse> {
    return this.get<NationalStatisticsResponse>('/v4/statistics/national-values/fsk', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getNationalStatisticsGR(params: any = {}): Promise<NationalStatisticsResponse> {
    return this.get<NationalStatisticsResponse>('/v4/statistics/national-values/gr', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getNationalStatisticsGRAN(params: any = {}): Promise<NationalStatisticsResponse> {
    return this.get<NationalStatisticsResponse>('/v4/statistics/national-values/gran', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getNationalStatisticsGY(params: any = {}): Promise<NationalStatisticsResponse> {
    // Stöd för programCode parameter
    const path = params.programCode
      ? `/v4/statistics/national-values/gy/${params.programCode}`
      : `/v4/statistics/national-values/gy`;

    // Ta bort programCode från query params om den finns, den är nu i path
    const { programCode, ...queryParams } = params;

    return this.get<NationalStatisticsResponse>(path, queryParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getNationalStatisticsGYAN(params: any = {}): Promise<NationalStatisticsResponse> {
    return this.get<NationalStatisticsResponse>('/v4/statistics/national-values/gyan', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSALSAStatisticsGR(params: any = {}): Promise<SALSAStatisticsResponse> {
    return this.get<SALSAStatisticsResponse>('/v4/statistics/salsa/gr', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSALSAStatisticsGRAN(params: any = {}): Promise<SALSAStatisticsResponse> {
    return this.get<SALSAStatisticsResponse>('/v4/statistics/salsa/gran', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getProgramStatisticsGY(params: any = {}): Promise<ProgramStatisticsResponse> {
    return this.get<ProgramStatisticsResponse>('/v4/statistics/per-program/gy', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getProgramStatisticsGYAN(params: any = {}): Promise<ProgramStatisticsResponse> {
    return this.get<ProgramStatisticsResponse>('/v4/statistics/per-program/gyan', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  /**
   * V4 - Support Data (Stöddata)
   */

  async getSchoolTypesV4(): Promise<SchoolTypesResponse> {
    return this.get<SchoolTypesResponse>('/v4/support/school-types', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getGeographicalAreasV4(): Promise<GeographicalAreasResponse> {
    return this.get<GeographicalAreasResponse>('/v4/support/geographical-areas', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getPrincipalOrganizerTypesV4(): Promise<PrincipalOrganizerTypesResponse> {
    return this.get<PrincipalOrganizerTypesResponse>('/v4/support/principal-organizer-types', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getProgramsV4(): Promise<ProgramsResponse> {
    return this.get<ProgramsResponse>('/v4/support/programs', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getOrientationsV4(): Promise<OrientationsResponse> {
    return this.get<OrientationsResponse>('/v4/support/orientations', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getInstructionLanguagesV4(): Promise<InstructionLanguagesResponse> {
    return this.get<InstructionLanguagesResponse>('/v4/support/instruction-languages', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getDistanceStudyTypesV4(): Promise<DistanceStudyTypesResponse> {
    return this.get<DistanceStudyTypesResponse>('/v4/support/distance-studies', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getAdultTypeOfSchoolingV4(): Promise<AdultTypeOfSchoolingResponse> {
    return this.get<AdultTypeOfSchoolingResponse>('/v4/support/adult-type-of-schooling', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getMunicipalitySchoolUnitsV4(): Promise<MunicipalitySchoolUnitsResponse> {
    return this.get<MunicipalitySchoolUnitsResponse>('/v4/support/municipality-school-units', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  /**
   * ===== NYA V4 ENDPOINTS =====
   */

  // Adult Education Areas
  async getAdultEducationAreasV4(): Promise<AdultEducationAreasResponse> {
    return this.get<AdultEducationAreasResponse>('/v4/adult-education-events/areas', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // API Info V4
  async getApiInfoV4(): Promise<ApiInfoV4Response> {
    return this.get<ApiInfoV4Response>('/v4/api-info', undefined, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Compact School Units V4
  async searchCompactSchoolUnitsV4(params: SchoolUnitSearchParamsV4 = {}): Promise<CompactSchoolUnitsV4Response> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      coordinateSystemType: 'WGS84', // Default enligt dokumentation
      ...params
    };

    return this.get<CompactSchoolUnitsV4Response>('/v4/compact-school-units', searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Secondary School Units
  async getSecondarySchoolUnitsV4(params: any = {}): Promise<SecondarySchoolUnitsResponse> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<SecondarySchoolUnitsResponse>('/v4/school-unit-secondary', searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // All Schools SALSA Statistics
  async getAllSchoolsSALSAStatistics(params: any = {}): Promise<AllSchoolsSALSAResponse> {
    return this.get<AllSchoolsSALSAResponse>('/v4/statistics/all-schools/salsa', params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitSALSAStatistics(schoolUnitId: string, params: any = {}): Promise<SchoolUnitSALSAResponse> {
    return this.get<SchoolUnitSALSAResponse>(`/v4/statistics/all-schools/salsa/${schoolUnitId}`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Document filtering by type of schooling
  async getSchoolUnitDocumentsByType(code: string, typeOfSchooling: string, params: any = {}): Promise<DocumentsByTypeResponse> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<DocumentsByTypeResponse>(`/v4/school-units/${code}/documents/${typeOfSchooling}`, searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Education events by study path
  async getSchoolUnitEducationEventsByStudyPath(code: string, studyPathCode: string, params: EducationEventSearchParamsV4 = {}): Promise<EducationEventsByStudyPathResponse> {
    const searchParams = {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params
    };

    return this.get<EducationEventsByStudyPathResponse>(`/v4/school-units/${code}/education-events/${studyPathCode}`, searchParams, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Specialiserade survey-endpoints - Nested (vårdnadshavare)
  async getSchoolUnitNestedSurveyCustodiansFSK(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/nestedsurveys/custodiansfsk`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitNestedSurveyCustodiansGR(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/nestedsurveys/custodiansgr`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitNestedSurveyCustodiansGRAN(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/nestedsurveys/custodiansgran`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Specialiserade survey-endpoints - Nested (elever)
  async getSchoolUnitNestedSurveyPupilsGY(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/nestedsurveys/pupilsgy`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Specialiserade survey-endpoints - Flat (vårdnadshavare)
  async getSchoolUnitFlatSurveyCustodiansFSK(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/custodiansfsk`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitFlatSurveyCustodiansGR(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/custodiansgr`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitFlatSurveyCustodiansGRAN(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/custodiansgran`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  // Specialiserade survey-endpoints - Flat (elever)
  async getSchoolUnitFlatSurveyPupilsGR(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/pupilsgr`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }

  async getSchoolUnitFlatSurveyPupilsGY(code: string, params: any = {}): Promise<SurveyByCategoryResponse> {
    return this.get<SurveyByCategoryResponse>(`/v4/school-units/${code}/surveys/pupilsgy`, params, {
      headers: { 'Accept': 'application/vnd.skolverket.plannededucations.api.v4.hal+json' }
    });
  }
}

// Singleton-instans
export const plannedEducationApi = new PlannedEducationApiClient();
