import { establishmentTimezoneSchema } from '../identity/establishment-timezone-schema.ts'
import { z } from 'zod'

export const shopTimezoneFormSchema = z.object({
  timeZone: establishmentTimezoneSchema,
})
