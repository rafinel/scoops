import { z } from 'zod'

export const comboLifecycleSchema = z.strictObject({
  expectedUpdatedAt: z.iso.datetime().transform((value) => new Date(value)),
})
