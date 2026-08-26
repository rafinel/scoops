import { z } from 'zod'

import { saveComboSchema } from './save-combo-schema.ts'

export const updateComboSchema = saveComboSchema.omit({ status: true }).extend({
  expectedUpdatedAt: z.iso.datetime().transform((value) => new Date(value)),
})
