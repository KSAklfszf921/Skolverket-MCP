/**
 * Runtime validation med Zod för tool-parametrar
 */

import { z, ZodSchema } from 'zod';
import { ValidationError } from './errors.js';
import { log } from './logger.js';

/**
 * Validera input mot ett Zod-schema
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown, toolName?: string): T {
  try {
    const validated = schema.parse(data);
    log.debug('Validation success', { toolName, data: validated });
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const field = firstError.path.join('.');
      const message = `Valideringsfel i ${toolName || 'tool'}: ${firstError.message} (fält: ${field})`;

      log.warn('Validation failed', {
        toolName,
        field,
        message: firstError.message,
        value: data
      });

      throw new ValidationError(message, field, data);
    }
    throw error;
  }
}

/**
 * Validera partiell input (endast de fält som skickas in)
 */
export function validatePartial<T>(schema: ZodSchema<T>, data: unknown, toolName?: string): Partial<T> {
  const partialSchema = schema instanceof z.ZodObject ? schema.partial() : schema;
  return validate(partialSchema as ZodSchema<Partial<T>>, data, toolName);
}

/**
 * Vanliga valideringsscheman som kan återanvändas
 */
export const commonSchemas = {
  // Kurskod (t.ex. MATMAT01c)
  courseCode: z.string()
    .min(1, 'Kurskod får inte vara tom')
    .regex(/^[A-Z0-9]+$/, 'Kurskod måste innehålla endast stora bokstäver och siffror'),

  // Ämneskod (t.ex. GRGRMAT01)
  subjectCode: z.string()
    .min(1, 'Ämneskod får inte vara tom')
    .regex(/^[A-Z0-9]+$/, 'Ämneskod måste innehålla endast stora bokstäver och siffror'),

  // Programkod (t.ex. NA, TE)
  programCode: z.string()
    .min(1, 'Programkod får inte vara tom')
    .regex(/^[A-Z]+$/, 'Programkod måste innehålla endast stora bokstäver'),

  // Läroplanskod (t.ex. LGR11)
  curriculumCode: z.string()
    .min(1, 'Läroplanskod får inte vara tom')
    .regex(/^[A-Z0-9]+$/, 'Läroplanskod måste innehålla endast stora bokstäver och siffror'),

  // Skoltyp
  schoolType: z.enum(['GR', 'GY', 'VUX', 'GRSÄR', 'GYSÄR'], {
    errorMap: () => ({ message: 'Ogiltig skoltyp. Tillåtna värden: GR, GY, VUX, GRSÄR, GYSÄR' })
  }),

  // Tidsperiod
  timespan: z.enum(['LATEST', 'HISTORIC', 'ALL'], {
    errorMap: () => ({ message: 'Ogiltig tidsperiod. Tillåtna värden: LATEST, HISTORIC, ALL' })
  }),

  // Versionsnummer
  version: z.number()
    .int('Versionsnummer måste vara ett heltal')
    .positive('Versionsnummer måste vara positivt'),

  // Skolenhetskod (8 siffror)
  schoolUnitCode: z.string()
    .length(8, 'Skolenhetskod måste vara 8 siffror')
    .regex(/^\d{8}$/, 'Skolenhetskod måste innehålla endast siffror'),

  // Status för skolenhet
  schoolUnitStatus: z.enum(['AKTIV', 'UPPHORT', 'VILANDE'], {
    errorMap: () => ({ message: 'Ogiltig status. Tillåtna värden: AKTIV, UPPHORT, VILANDE' })
  }),

  // Utbildnings-ID
  educationId: z.string()
    .min(1, 'Utbildnings-ID får inte vara tomt'),

  // Studietakt
  paceOfStudy: z.string()
    .regex(/^\d+(-\d+)?$/, 'Studietakt måste vara ett tal eller intervall (t.ex. "100" eller "50-100")'),

  // Boolean som sträng (från API)
  booleanString: z.enum(['true', 'false'])
    .transform(val => val === 'true'),

  // Datum i ISO format
  isoDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum måste vara i format YYYY-MM-DD'),

  // Sidnummer för pagination
  page: z.number()
    .int('Sidnummer måste vara ett heltal')
    .nonnegative('Sidnummer måste vara 0 eller högre')
    .default(0),

  // Antal resultat per sida
  size: z.number()
    .int('Sidstorlek måste vara ett heltal')
    .min(1, 'Sidstorlek måste vara minst 1')
    .max(100, 'Sidstorlek kan max vara 100')
    .default(20)
};
