/**
 * Constants, enums och typer för Skolverket MCP Server
 */

/**
 * Tool names som enums för type safety
 */
export enum ToolName {
  // Läroplan API - Subjects
  SEARCH_SUBJECTS = 'search_subjects',
  GET_SUBJECT_DETAILS = 'get_subject_details',
  GET_SUBJECT_VERSIONS = 'get_subject_versions',

  // Läroplan API - Courses
  SEARCH_COURSES = 'search_courses',
  GET_COURSE_DETAILS = 'get_course_details',
  GET_COURSE_VERSIONS = 'get_course_versions',

  // Läroplan API - Programs
  SEARCH_PROGRAMS = 'search_programs',
  GET_PROGRAM_DETAILS = 'get_program_details',
  GET_PROGRAM_VERSIONS = 'get_program_versions',

  // Läroplan API - Curriculums
  SEARCH_CURRICULUMS = 'search_curriculums',
  GET_CURRICULUM_DETAILS = 'get_curriculum_details',
  GET_CURRICULUM_VERSIONS = 'get_curriculum_versions',

  // Läroplan API - Value Store
  GET_SCHOOL_TYPES = 'get_school_types',
  GET_TYPES_OF_SYLLABUS = 'get_types_of_syllabus',
  GET_SUBJECT_AND_COURSE_CODES = 'get_subject_and_course_codes',
  GET_STUDY_PATH_CODES = 'get_study_path_codes',
  GET_API_INFO = 'get_api_info',

  // Skolenhetsregistret API
  SEARCH_SCHOOL_UNITS = 'search_school_units',
  GET_SCHOOL_UNIT_DETAILS = 'get_school_unit_details',
  GET_SCHOOL_UNITS_BY_STATUS = 'get_school_units_by_status',
  SEARCH_SCHOOL_UNITS_BY_NAME = 'search_school_units_by_name',

  // Planned Education API
  SEARCH_ADULT_EDUCATION = 'search_adult_education',
  GET_ADULT_EDUCATION_DETAILS = 'get_adult_education_details',
  FILTER_ADULT_EDUCATION_BY_DISTANCE = 'filter_adult_education_by_distance',
  FILTER_ADULT_EDUCATION_BY_PACE = 'filter_adult_education_by_pace',
  GET_EDUCATION_AREAS = 'get_education_areas',
  GET_DIRECTIONS = 'get_directions',

  // Diagnostik
  HEALTH_CHECK = 'health_check'
}

/**
 * Prompt names som enums för type safety
 */
export enum PromptName {
  ANALYZE_COURSE = 'analyze_course',
  COMPARE_CURRICULUM_VERSIONS = 'compare_curriculum_versions',
  FIND_ADULT_EDUCATION = 'find_adult_education',
  PLAN_STUDY_PATH = 'plan_study_path',
  TEACHER_COURSE_PLANNING = 'teacher_course_planning'
}

/**
 * Resource URIs som constants
 */
export enum ResourceUri {
  API_INFO = 'skolverket://api/info',
  SCHOOL_TYPES = 'skolverket://school-types',
  TYPES_OF_SYLLABUS = 'skolverket://types-of-syllabus',
  EDUCATION_AREAS = 'skolverket://education-areas'
}

/**
 * MCP Server metadata
 */
export const SERVER_NAME = 'skolverket-mcp';
export const SERVER_VERSION = '2.1.3';

/**
 * Cache defaults
 */
export const CACHE_DEFAULTS = {
  DEFAULT_TTL_MS: 3600000, // 1 hour
  VALUESTORE_TTL_MS: 86400000, // 24 hours
  MAX_CACHE_SIZE: 1000, // Max antal cache entries
  PRUNE_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * HTTP defaults
 */
export const HTTP_DEFAULTS = {
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  MAX_CONCURRENT: 5,
} as const;

/**
 * Logging defaults
 */
export const LOGGING_DEFAULTS = {
  MAX_FILE_SIZE: 5242880, // 5MB
  MAX_FILES: 5,
  DEFAULT_LEVEL: 'info',
} as const;
