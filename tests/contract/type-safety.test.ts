import { describe, it, expectTypeOf } from 'vitest';

// Dina befintliga manuella typer
import type { SchoolUnit } from '../../src/types/school-units';
import type { Subject, Course } from '../../src/types/syllabus';
import type { PlannedEducation } from '../../src/types/planned-education';

// De autogenererade typerna från API:et
import type { components as SchoolUnitComponents } from '../../src/types/generated/school-units-schema';
import type { components as SyllabusComponents } from '../../src/types/generated/syllabus-schema';
import type { components as PlannedEduComponents } from '../../src/types/generated/planned-education-schema';

/**
 * Mappning av API-typer.
 * OBS: Om Skolverket ändrar namngivning i v1/v2/v4 så syns det här.
 * Vi använder 'SubjectDto' etc då det ofta är standard i deras v1/v4 API.
 */
type GenSchoolUnit = SchoolUnitComponents['schemas']['SchoolUnit'];

// Syllabus v1 använder ofta DTO-suffix
type GenSubject = SyllabusComponents['schemas']['SubjectDto'] | SyllabusComponents['schemas']['Subject'];
type GenCourse = SyllabusComponents['schemas']['CourseDto'] | SyllabusComponents['schemas']['Course'];

// Planned Education v4
type GenPlannedEducation = PlannedEduComponents['schemas']['PlannedEducationDto'] | PlannedEduComponents['schemas']['PlannedEducation'];

describe('API Contract Safety', () => {
  
  describe('Skolenhetsregistret v2', () => {
    it('SchoolUnit interface should be compatible', () => {
      // Verifierar att din SchoolUnit-typ är en giltig delmängd av API:ets svar
      expectTypeOf<GenSchoolUnit>().toMatchTypeOf<Partial<SchoolUnit>>();
    });
  });

  describe('Syllabus v1', () => {
    it('Subject interface should be compatible', () => {
      expectTypeOf<GenSubject>().toMatchTypeOf<Partial<Subject>>();
    });

    it('Course interface should be compatible', () => {
      expectTypeOf<GenCourse>().toMatchTypeOf<Partial<Course>>();
    });
  });

  describe('Planned Education v4', () => {
    it('PlannedEducation interface should be compatible', () => {
      expectTypeOf<GenPlannedEducation>().toMatchTypeOf<Partial<PlannedEducation>>();
    });
  });
});
