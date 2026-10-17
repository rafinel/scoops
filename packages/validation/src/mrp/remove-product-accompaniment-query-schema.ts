import { AccompanimentRemovalScope } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const removeProductAccompanimentQuerySchema = z.strictObject({
  scope: z.enum(AccompanimentRemovalScope).optional(),
})
