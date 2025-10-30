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
