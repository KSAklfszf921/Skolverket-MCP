/**
 * API-klient för Skolverkets Läroplan API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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
} from '../types/skolverket.js';

const BASE_URL = 'https://api.skolverket.se/syllabus';

export class SkolverketApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'skolverket-syllabus-mcp/1.0.0'
      }
    });

    // Lägg till error handler
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          throw new Error(
            `Skolverket API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
          );
        } else if (error.request) {
          throw new Error('Kunde inte nå Skolverkets API. Kontrollera internetanslutningen.');
        } else {
          throw new Error(`Request error: ${error.message}`);
        }
      }
    );
  }

  // Ämnen (Subjects)
  async searchSubjects(params: SubjectSearchParams = {}): Promise<SubjectsResponse> {
    const response = await this.client.get<SubjectsResponse>('/v1/subjects', { params });
    return response.data;
  }

  async getSubject(code: string, version?: number): Promise<Subject> {
    const url = version
      ? `/v1/subjects/${code}/versions/${version}`
      : `/v1/subjects/${code}`;
    const response = await this.client.get<Subject>(url);
    return response.data;
  }

  async getSubjectVersions(code: string): Promise<VersionsResponse> {
    const response = await this.client.get<VersionsResponse>(`/v1/subjects/${code}/versions`);
    return response.data;
  }

  // Kurser (Courses)
  async searchCourses(params: CourseSearchParams = {}): Promise<CoursesResponse> {
    const response = await this.client.get<CoursesResponse>('/v1/courses', { params });
    return response.data;
  }

  async getCourse(code: string, version?: number): Promise<Course> {
    const url = version
      ? `/v1/courses/${code}/versions/${version}`
      : `/v1/courses/${code}`;
    const response = await this.client.get<Course>(url);
    return response.data;
  }

  async getCourseVersions(code: string): Promise<VersionsResponse> {
    const response = await this.client.get<VersionsResponse>(`/v1/courses/${code}/versions`);
    return response.data;
  }

  // Program (Programs)
  async searchPrograms(params: ProgramSearchParams = {}): Promise<ProgramsResponse> {
    const response = await this.client.get<ProgramsResponse>('/v1/programs', { params });
    return response.data;
  }

  async getProgram(code: string, version?: number): Promise<Program> {
    const url = version
      ? `/v1/programs/${code}/versions/${version}`
      : `/v1/programs/${code}`;
    const response = await this.client.get<Program>(url);
    return response.data;
  }

  async getProgramVersions(code: string): Promise<VersionsResponse> {
    const response = await this.client.get<VersionsResponse>(`/v1/programs/${code}/versions`);
    return response.data;
  }

  // Läroplaner (Curriculums)
  async searchCurriculums(params: SubjectSearchParams = {}): Promise<CurriculumsResponse> {
    const response = await this.client.get<CurriculumsResponse>('/v1/curriculums', { params });
    return response.data;
  }

  async getCurriculum(code: string, version?: number): Promise<Curriculum> {
    const url = version
      ? `/v1/curriculums/${code}/versions/${version}`
      : `/v1/curriculums/${code}`;
    const response = await this.client.get<Curriculum>(url);
    return response.data;
  }

  async getCurriculumVersions(code: string): Promise<VersionsResponse> {
    const response = await this.client.get<VersionsResponse>(`/v1/curriculums/${code}/versions`);
    return response.data;
  }

  // Värdesamlingar (Value Store)
  async getSchoolTypes(): Promise<SchoolType[]> {
    const response = await this.client.get<{ schoolTypes: SchoolType[] }>('/v1/valuestore/schooltypes');
    return response.data.schoolTypes || [];
  }

  async getExpiredSchoolTypes(): Promise<SchoolType[]> {
    const response = await this.client.get<{ schoolTypes: SchoolType[] }>('/v1/valuestore/schooltypes/expired');
    return response.data.schoolTypes || [];
  }

  async getTypesOfSyllabus(): Promise<TypeOfSyllabus[]> {
    const response = await this.client.get<{ typesOfSyllabus: TypeOfSyllabus[] }>('/v1/valuestore/typeofsyllabus');
    return response.data.typesOfSyllabus || [];
  }

  async getSubjectAndCourseCodes(): Promise<SubjectAndCourseCode[]> {
    const response = await this.client.get<{ codes: SubjectAndCourseCode[] }>('/v1/valuestore/subjectandcoursecodes');
    return response.data.codes || [];
  }

  async getStudyPathCodes(params: StudyPathSearchParams = {}): Promise<StudyPathCode[]> {
    const response = await this.client.get<{ studyPaths: StudyPathCode[] }>('/v1/valuestore/studypathcodes', { params });
    return response.data.studyPaths || [];
  }

  // API-information
  async getApiInfo(): Promise<ApiInfo> {
    const response = await this.client.get<ApiInfo>('/v1/api-info');
    return response.data;
  }
}

// Singleton-instans
export const skolverketApi = new SkolverketApiClient();
