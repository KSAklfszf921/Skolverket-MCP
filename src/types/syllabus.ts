/**
 * TypeScript-typer för Skolverkets Läroplan API
 * Baserat på OpenAPI 3.1.0 specifikation
 */

// Gemensamma metadata för alla API-svar
export interface ApiMetadata {
  apiPublisher: string;
  apiVersion: string;
  totalElements: number;
  processingTime: string;
  startedCaching: string;
}

// Tidsperioder (enligt officiell Skolverket Syllabus API spec)
export type Timespan = 'LATEST' | 'FUTURE' | 'EXPIRED' | 'MODIFIED';

// Värdesamlingar (Value Store)
export interface SchoolType {
  code: string;
  name: string;
  description?: string;
}

export interface TypeOfSyllabus {
  code: string;
  name: string;
  description?: string;
}

export interface SubjectAndCourseCode {
  code: string;
  name: string;
  type: 'SUBJECT' | 'COURSE';
}

export interface StudyPathCode {
  code: string;
  name: string;
  schoolType: string;
  studyPathType?: string;
}

// Ämnen (Subjects)
export interface Subject {
  code: string;
  name: string;
  description?: string;
  schoolType: string;
  typeOfSyllabus: string;
  version: number;
  validFrom?: string;
  validTo?: string;
  courses?: Course[];
  centralContent?: CentralContent[];
  knowledgeRequirements?: KnowledgeRequirement[];
  purposes?: Purpose[];
}

export interface SubjectVersion {
  version: number;
  validFrom: string;
  validTo?: string;
  status: string;
}

export interface SubjectsResponse extends ApiMetadata {
  subjects: Subject[];
}

// Kurser (Courses)
export interface Course {
  code: string;
  name: string;
  description?: string;
  subjectCode?: string;
  schoolType: string;
  typeOfSyllabus: string;
  version: number;
  validFrom?: string;
  validTo?: string;
  points?: number;
  centralContent?: CentralContent[];
  knowledgeRequirements?: KnowledgeRequirement[];
  purposes?: Purpose[];
}

export interface CoursesResponse extends ApiMetadata {
  courses: Course[];
}

// Program (Programs)
export interface Program {
  code: string;
  name: string;
  description?: string;
  schoolType: string;
  studyPathType?: string;
  version: number;
  validFrom?: string;
  validTo?: string;
  orientations?: Orientation[];
  profiles?: Profile[];
  vocationalOutcomes?: VocationalOutcome[];
  purposes?: Purpose[];
}

export interface Orientation {
  code: string;
  name: string;
  description?: string;
}

export interface Profile {
  code: string;
  name: string;
  description?: string;
}

export interface VocationalOutcome {
  name: string;
  description?: string;
}

export interface ProgramsResponse extends ApiMetadata {
  programs: Program[];
}

// Läroplaner (Curriculums)
export interface Curriculum {
  code: string;
  name: string;
  description?: string;
  schoolType: string;
  typeOfSyllabus: string;
  version: number;
  validFrom?: string;
  validTo?: string;
  sections?: CurriculumSection[];
}

export interface CurriculumSection {
  heading: string;
  content: string;
  subsections?: CurriculumSection[];
}

export interface CurriculumsResponse extends ApiMetadata {
  curriculums: Curriculum[];
}

// Innehåll och kunskapskrav
export interface CentralContent {
  heading: string;
  content: string;
  year?: string;
  grade?: string;
}

export interface KnowledgeRequirement {
  grade: string;
  content: string;
  criteria?: KnowledgeCriteria[];
}

export interface KnowledgeCriteria {
  heading: string;
  content: string;
}

export interface Purpose {
  heading?: string;
  content: string;
}

// Sökparametrar
export interface SearchParams {
  schooltype?: string;
  timespan?: Timespan;
  typeOfSyllabus?: string;
  date?: string; // YYYY-MM-DD format
}

export interface SubjectSearchParams extends SearchParams {
  // Inga extra parametrar för subjects
}

export interface CourseSearchParams extends SearchParams {
  subjectCode?: string;
}

export interface ProgramSearchParams extends SearchParams {
  typeOfStudyPath?: string;
}

export interface StudyPathSearchParams {
  schooltype?: string;
  timespan?: string;
  date?: string;
  typeOfStudyPath?: string;
  typeOfProgram?: string;
}

// Versionshantering
export interface VersionsResponse extends ApiMetadata {
  versions: SubjectVersion[];
}

// API-information
export interface ApiInfo {
  version: string;
  description: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
}
