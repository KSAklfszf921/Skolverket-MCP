/**
 * TypeScript-typer för Planned Educations API
 */

// Gemensam API Response-struktur
export interface ApiResponse<T> {
  status: string;
  message: string;
  body: T;
}

// Vuxenutbildning (Adult Education)
export interface AdultEducationEvent {
  educationEventId: string;
  providerName: string;
  county?: string;
  municipality?: string;
  geographicalAreaCode?: string;
  credits?: string;
  creditsSystem?: string;
  contractor?: string | null;
  location?: string | null;
  town?: string;
  contactInfoAddressCity?: string;
  typeOfSchool: string;
  semesterStartFrom?: string;
  paceOfStudy?: string;
  titleSv: string;
  extent?: string | null;
  distance: boolean;
  recommendedPriorKnowledge?: string | null;
  lastApplicationDate?: string | null;
  executionCondition: number;
  _links?: any;
}

export interface AdultEducationResponse {
  _embedded: {
    listedAdultEducationEvents: AdultEducationEvent[];
  };
  _links?: any;
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// Sökparametrar för vuxenutbildning
export interface AdultEducationSearchParams {
  town?: string;
  executionCondition?: string;
  geographicalAreaCode?: string;
  searchTerm?: string;
  instructionLanguages?: string;
  directionIds?: string;
  typeOfSchool?: string;
  paceOfStudy?: string;
  semesterStartFrom?: string;
  county?: string;
  municipality?: string;
  distance?: string; // "true" | "false"
  recommendedPriorKnowledge?: string;
  sort?: string;
  page?: number;
  size?: number;
}

// Skolenheter (School Units)
export interface PlannedSchoolUnit {
  schoolUnitCode: string;
  name: string;
  schoolType?: string;
  municipality?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface SchoolUnitCompactResponse {
  _embedded: {
    listedSchoolUnits: PlannedSchoolUnit[];
  };
  _links?: any;
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// Utbildningstillfällen (Education Events)
export interface EducationEvent {
  educationEventId: string;
  schoolUnitCode?: string;
  schoolUnitName?: string;
  programCode?: string;
  programName?: string;
  startDate?: string;
  endDate?: string;
  applicationDeadline?: string;
  distance?: boolean;
  municipality?: string;
  county?: string;
}

// Statistik (Statistics)
export interface SchoolStatistics {
  schoolUnitCode: string;
  schoolYear: string;
  statisticsType: string;
  value: number;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface StatisticsResponse {
  statistics: SchoolStatistics[];
  metadata?: {
    schoolYear: string;
    extractDate: string;
  };
}

// Dokument (Documents) - Inspektionsrapporter
export interface InspectionDocument {
  documentId: string;
  schoolUnitCode: string;
  schoolUnitName?: string;
  documentType: string;
  title: string;
  publicationDate?: string;
  url?: string;
  summary?: string;
}

export interface DocumentsResponse {
  _embedded: {
    documents: InspectionDocument[];
  };
  _links?: any;
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// Skolenkät (School Survey)
export interface SchoolSurveyData {
  schoolUnitCode: string;
  surveyYear: string;
  questionId: string;
  question: string;
  responseCategory: string;
  value: number;
  respondentGroup?: string;
}

export interface SchoolSurveyResponse {
  surveyData: SchoolSurveyData[];
  metadata?: {
    surveyYear: string;
    extractDate: string;
  };
}

// Stöddata (Support Data)
export interface EducationArea {
  id: string;
  name: string;
  directions?: Direction[];
}

export interface Direction {
  id: string;
  name: string;
  areaId: string;
}

export interface SupportDataResponse {
  areas?: EducationArea[];
  directions?: Direction[];
}

// ===== V4 API TYPES =====

// V4 School Unit - Full detailed version
export interface SchoolUnitV4 {
  schoolUnitCode: string;
  name: string;
  schoolType?: string;
  schoolTypes?: string[];
  status?: string;
  municipality?: string;
  municipalityCode?: string;
  county?: string;
  countyCode?: string;
  principalOrganizer?: string;
  principalOrganizerType?: string;
  geographicalArea?: string;
  geographicalAreaCode?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  _links?: Record<string, any>;
}

export interface SchoolUnitV4Response {
  _embedded: {
    schoolUnits: SchoolUnitV4[];
  };
  _links?: Record<string, any>;
  page?: PageInfo;
}

export interface SchoolUnitDetailsV4 extends SchoolUnitV4 {
  description?: string;
  foundingDate?: string;
  closingDate?: string;
  additionalInfo?: Record<string, any>;
}

// V4 Education Events - Compact and Full
export interface CompactEducationEvent {
  educationEventId: string;
  schoolUnitCode: string;
  schoolUnitName?: string;
  titleSv: string;
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  geographicalAreaCode?: string;
  semesterStartFrom?: string;
  distance?: boolean;
  paceOfStudy?: string;
  _links?: Record<string, any>;
}

export interface FullEducationEvent extends CompactEducationEvent {
  providerName?: string;
  contractor?: string;
  location?: string;
  town?: string;
  contactInfoAddressCity?: string;
  credits?: string;
  creditsSystem?: string;
  extent?: string;
  recommendedPriorKnowledge?: string;
  lastApplicationDate?: string;
  executionCondition?: number;
  directionIds?: string[];
  instructionLanguages?: string[];
  programCode?: string;
  orientationCode?: string;
  educationAreaCode?: string;
}

export interface EducationEventsV4Response {
  _embedded: {
    educationEvents: FullEducationEvent[];
  };
  _links?: Record<string, any>;
  page?: PageInfo;
}

export interface CompactEducationEventsV4Response {
  _embedded: {
    compactEducationEvents: CompactEducationEvent[];
  };
  _links?: Record<string, any>;
  page?: PageInfo;
}

export interface EducationEventsCountResponse {
  count: number;
  filters?: Record<string, any>;
}

// V4 Statistics structures
export interface StatisticsLink {
  rel: string;
  href: string;
  description?: string;
}

export interface SchoolUnitStatisticsLinks {
  schoolUnitCode: string;
  schoolUnitName?: string;
  _links: {
    fsk?: StatisticsLink;
    gr?: StatisticsLink;
    gran?: StatisticsLink;
    gy?: StatisticsLink;
    gyan?: StatisticsLink;
    [key: string]: StatisticsLink | undefined;
  };
}

export interface NationalStatisticsValue {
  schoolType: string;
  schoolYear: string;
  indicator: string;
  value: number;
  unit?: string;
  description?: string;
}

export interface NationalStatisticsResponse {
  schoolType: string;
  values: NationalStatisticsValue[];
  metadata?: {
    extractDate: string;
    schoolYear: string;
  };
}

export interface SALSAStatistics {
  schoolUnitCode: string;
  schoolYear: string;
  subject?: string;
  grade?: string;
  averageScore?: number;
  distribution?: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface SALSAStatisticsResponse {
  statistics: SALSAStatistics[];
  metadata?: {
    schoolYear: string;
    extractDate: string;
  };
}

export interface ProgramStatistics {
  programCode: string;
  programName?: string;
  schoolYear: string;
  orientation?: string;
  statistics: Record<string, any>;
}

export interface ProgramStatisticsResponse {
  programs: ProgramStatistics[];
  metadata?: {
    schoolYear: string;
    extractDate: string;
  };
}

// V4 School Survey - Nested and Flat structures
export interface NestedSurveyQuestion {
  questionId: string;
  question: string;
  responses: {
    [responseCategory: string]: number;
  };
}

export interface NestedSurveyRespondentGroup {
  respondentGroup: string;
  questions: NestedSurveyQuestion[];
}

export interface NestedSchoolSurvey {
  schoolUnitCode: string;
  schoolUnitName?: string;
  surveyYear: string;
  respondentGroups: NestedSurveyRespondentGroup[];
}

export interface NestedSurveyResponse {
  survey: NestedSchoolSurvey;
  metadata?: {
    surveyYear: string;
    extractDate: string;
  };
}

export interface FlatSurveyDataPoint {
  schoolUnitCode: string;
  surveyYear: string;
  respondentGroup: string;
  questionId: string;
  question: string;
  responseCategory: string;
  value: number;
}

export interface FlatSurveyResponse {
  data: FlatSurveyDataPoint[];
  metadata?: {
    surveyYear: string;
    extractDate: string;
  };
}

// V4 Documents
export interface DocumentV4 {
  documentId: string;
  schoolUnitCode?: string;
  documentType: string;
  title: string;
  publicationDate?: string;
  url?: string;
  summary?: string;
  metadata?: Record<string, any>;
}

export interface DocumentsV4Response {
  _embedded: {
    documents: DocumentV4[];
  };
  _links?: Record<string, any>;
  page?: PageInfo;
}

// V4 Support Data (Stöddata)
export interface SchoolTypeV4 {
  code: string;
  name: string;
  description?: string;
}

export interface GeographicalAreaV4 {
  code: string;
  name: string;
  type?: string; // LÄN, KOMMUN, etc.
  parentCode?: string;
}

export interface PrincipalOrganizerTypeV4 {
  code: string;
  name: string;
  description?: string;
}

export interface ProgramV4 {
  code: string;
  name: string;
  schoolType?: string;
  typeOfProgram?: string; // HÖGSKOLEFÖRBEREDANDE, YRKES
  orientations?: OrientationV4[];
}

export interface OrientationV4 {
  code: string;
  name: string;
  programCode: string;
}

export interface InstructionLanguageV4 {
  code: string;
  name: string;
}

export interface DistanceStudyTypeV4 {
  code: string;
  name: string;
  description?: string;
}

export interface AdultTypeOfSchoolingV4 {
  code: string;
  name: string;
  description?: string;
}

export interface MunicipalitySchoolUnitMapping {
  municipalityCode: string;
  municipalityName: string;
  schoolUnitCodes: string[];
}

export interface SchoolTypesResponse {
  schoolTypes: SchoolTypeV4[];
}

export interface GeographicalAreasResponse {
  geographicalAreas: GeographicalAreaV4[];
}

export interface PrincipalOrganizerTypesResponse {
  principalOrganizerTypes: PrincipalOrganizerTypeV4[];
}

export interface ProgramsResponse {
  programs: ProgramV4[];
}

export interface OrientationsResponse {
  orientations: OrientationV4[];
}

export interface InstructionLanguagesResponse {
  instructionLanguages: InstructionLanguageV4[];
}

export interface DistanceStudyTypesResponse {
  distanceStudyTypes: DistanceStudyTypeV4[];
}

export interface AdultTypeOfSchoolingResponse {
  adultTypeOfSchooling: AdultTypeOfSchoolingV4[];
}

export interface MunicipalitySchoolUnitsResponse {
  municipalities: MunicipalitySchoolUnitMapping[];
}

// Distance calculation
export interface DistanceCalculation {
  fromSchoolUnitCode: string;
  toLatitude: number;
  toLongitude: number;
  distanceKm: number;
  method?: string; // haversine, etc.
}

// Pagination info
export interface PageInfo {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

// Search parameters for v4
export interface SchoolUnitSearchParamsV4 {
  name?: string;
  schoolType?: string;
  municipality?: string;
  municipalityCode?: string;
  county?: string;
  countyCode?: string;
  status?: string;
  geographicalAreaCode?: string;
  principalOrganizerType?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface EducationEventSearchParamsV4 {
  schoolUnitCode?: string;
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  geographicalAreaCode?: string;
  distance?: boolean;
  paceOfStudy?: string;
  semesterStartFrom?: string;
  programCode?: string;
  orientationCode?: string;
  educationAreaCode?: string;
  directionIds?: string;
  instructionLanguages?: string;
  searchTerm?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ===== NYA TYPES FÖR SAKNADE ENDPOINTS =====

// Adult Education Areas
export interface AdultEducationArea {
  areaCode: string;
  areaName: string;
  directions?: AdultEducationDirection[];
}

export interface AdultEducationDirection {
  directionId: string;
  directionName: string;
  areaCode: string;
}

export interface AdultEducationAreasResponse {
  areas: AdultEducationArea[];
  _links?: Record<string, any>;
}

// API Info V4
export interface ApiInfoV4 {
  version: string;
  name: string;
  description?: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  endpoints?: {
    path: string;
    methods: string[];
    description?: string;
  }[];
  supportedVersions?: string[];
  deprecationNotice?: string;
}

export interface ApiInfoV4Response {
  apiInfo: ApiInfoV4;
}

// Compact School Units V4
export interface CompactSchoolUnitV4 {
  schoolUnitCode: string;
  schoolUnitName: string;
  typeOfSchool?: string;
  municipality?: string;
  county?: string;
  abroadSchool: boolean;
  wgs84Latitude?: string;
  wgs84Longitude?: string;
  sweref99Latitude?: string;
  sweref99Longitude?: string;
  coordinateSystemType?: string;
}

export interface CompactSchoolUnitsV4Response {
  _embedded: {
    compactSchoolUnits: CompactSchoolUnitV4[];
  };
  _links?: Record<string, any>;
  page?: PageInfo;
}

// Secondary School Units
export interface SecondarySchoolUnit {
  schoolUnitCode: string;
  schoolUnitName: string;
  parentSchoolUnitCode: string;
  parentSchoolUnitName: string;
  relationshipType: string; // "filial", "annan_underenhet", etc.
  municipality?: string;
  county?: string;
  status?: string;
}

export interface SecondarySchoolUnitsResponse {
  _embedded: {
    secondarySchoolUnits: SecondarySchoolUnit[];
  };
  _links?: Record<string, any>;
  page?: PageInfo;
}

// All Schools SALSA Statistics
export interface AllSchoolsSALSAStatistics {
  schoolYear: string;
  typeOfSchooling: string;
  nationalAverage?: number;
  schools: SchoolSALSAData[];
  metadata?: {
    extractDate?: string;
    description?: string;
  };
}

export interface SchoolSALSAData {
  schoolUnitCode: string;
  schoolUnitName: string;
  salsaScore?: number;
  municipality?: string;
  county?: string;
  numberOfStudents?: number;
}

export interface AllSchoolsSALSAResponse {
  data: AllSchoolsSALSAStatistics;
  _links?: Record<string, any>;
}

export interface SchoolUnitSALSAResponse {
  schoolUnitCode: string;
  schoolUnitName: string;
  salsaData: {
    schoolYear: string;
    typeOfSchooling: string;
    salsaScore?: number;
    nationalComparison?: {
      nationalAverage: number;
      percentile?: number;
    };
  }[];
  _links?: Record<string, any>;
}

// Document filtering by type of schooling
export interface DocumentsByTypeResponse {
  typeOfSchooling: string;
  _embedded: {
    documents: DocumentV4[];
  };
  _links?: Record<string, any>;
  page?: PageInfo;
}

// Education events by study path
export interface EducationEventsByStudyPathResponse {
  studyPathCode: string;
  studyPathName?: string;
  _embedded: {
    educationEvents: FullEducationEvent[];
  };
  _links?: Record<string, any>;
  page?: PageInfo;
}

// Specialiserade survey-typer
export interface SurveyByCategoryResponse {
  schoolUnitCode: string;
  category: 'custodians' | 'pupils';
  typeOfSchooling: 'fsk' | 'gr' | 'gran' | 'gy' | 'gyan';
  format: 'nested' | 'flat';
  data: any; // Kan vara NestedSchoolSurvey eller FlatSurveyDataPoint[]
  metadata?: {
    surveyYear: string;
    extractDate: string;
    responseRate?: number;
  };
}
