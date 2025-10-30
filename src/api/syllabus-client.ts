/**
 * API-klient för Skolverkets Läroplan API
 */

import { BaseApiClient } from './base-client.js';
import type {
  SubjectsResponse,
  Subject,
  CoursesResponse,
  Course,
  ProgramsResponse,
  Program,
  CurriculumsResponse,
  Curriculum,
  SubjectSearchParams,
  CourseSearchParams,
  ProgramSearchParams,
  StudyPathSearchParams,
  SchoolType,
  TypeOfSyllabus,
  SubjectAndCourseCode,
  StudyPathCode,
  VersionsResponse,
  ApiInfo
} from '../types/syllabus.js';

export class SyllabusApiClient extends BaseApiClient {
  constructor() {
    super({
      baseURL: 'https://api.skolverket.se/syllabus',
      userAgent: 'skolverket-mcp/2.0.0'
    });
  }

  // Ämnen (Subjects)
  async searchSubjects(params: SubjectSearchParams = {}): Promise<SubjectsResponse> {
    return this.get<SubjectsResponse>('/v1/subjects', params);
  }

  async getSubject(code: string, version?: number): Promise<Subject> {
    const url = version
      ? `/v1/subjects/${code}/versions/${version}`
      : `/v1/subjects/${code}`;
    return this.get<Subject>(url);
  }

  async getSubjectVersions(code: string): Promise<VersionsResponse> {
    return this.get<VersionsResponse>(`/v1/subjects/${code}/versions`);
  }

  // Kurser (Courses)
  async searchCourses(params: CourseSearchParams = {}): Promise<CoursesResponse> {
    return this.get<CoursesResponse>('/v1/courses', params);
  }

  async getCourse(code: string, version?: number): Promise<Course> {
    const url = version
      ? `/v1/courses/${code}/versions/${version}`
      : `/v1/courses/${code}`;
    return this.get<Course>(url);
  }

  async getCourseVersions(code: string): Promise<VersionsResponse> {
    return this.get<VersionsResponse>(`/v1/courses/${code}/versions`);
  }

  // Program (Programs)
  async searchPrograms(params: ProgramSearchParams = {}): Promise<ProgramsResponse> {
    return this.get<ProgramsResponse>('/v1/programs', params);
  }

  async getProgram(code: string, version?: number): Promise<Program> {
    const url = version
      ? `/v1/programs/${code}/versions/${version}`
      : `/v1/programs/${code}`;
    return this.get<Program>(url);
  }

  async getProgramVersions(code: string): Promise<VersionsResponse> {
    return this.get<VersionsResponse>(`/v1/programs/${code}/versions`);
  }

  // Läroplaner (Curriculums)
  async searchCurriculums(params: SubjectSearchParams = {}): Promise<CurriculumsResponse> {
    return this.get<CurriculumsResponse>('/v1/curriculums', params);
  }

  async getCurriculum(code: string, version?: number): Promise<Curriculum> {
    const url = version
      ? `/v1/curriculums/${code}/versions/${version}`
      : `/v1/curriculums/${code}`;
    return this.get<Curriculum>(url);
  }

  async getCurriculumVersions(code: string): Promise<VersionsResponse> {
    return this.get<VersionsResponse>(`/v1/curriculums/${code}/versions`);
  }

  // Värdesamlingar (Value Store) - använder caching för statiska värden
  async getSchoolTypes(): Promise<SchoolType[]> {
    const response = await this.getCached<{ schoolTypes: SchoolType[] }>(
      '/v1/valuestore/schooltypes',
      undefined,
      86400000 // 24 timmar cache
    );
    return response.schoolTypes || [];
  }

  async getExpiredSchoolTypes(): Promise<SchoolType[]> {
    const response = await this.getCached<{ schoolTypes: SchoolType[] }>(
      '/v1/valuestore/schooltypes/expired',
      undefined,
      86400000 // 24 timmar cache
    );
    return response.schoolTypes || [];
  }

  async getTypesOfSyllabus(): Promise<TypeOfSyllabus[]> {
    const response = await this.getCached<{ typesOfSyllabus: TypeOfSyllabus[] }>(
      '/v1/valuestore/typeofsyllabus',
      undefined,
      86400000 // 24 timmar cache
    );
    return response.typesOfSyllabus || [];
  }

  async getSubjectAndCourseCodes(): Promise<SubjectAndCourseCode[]> {
    const response = await this.getCached<{ codes: SubjectAndCourseCode[] }>(
      '/v1/valuestore/subjectandcoursecodes',
      undefined,
      86400000 // 24 timmar cache
    );
    return response.codes || [];
  }

  async getStudyPathCodes(params: StudyPathSearchParams = {}): Promise<StudyPathCode[]> {
    const response = await this.getCached<{ studyPaths: StudyPathCode[] }>(
      '/v1/valuestore/studypathcodes',
      params,
      86400000 // 24 timmar cache
    );
    return response.studyPaths || [];
  }

  // API-information - caching i 1 timme
  async getApiInfo(): Promise<ApiInfo> {
    return this.getCached<ApiInfo>('/v1/api-info', undefined, 3600000);
  }
}

// Singleton-instans
export const syllabusApi = new SyllabusApiClient();
