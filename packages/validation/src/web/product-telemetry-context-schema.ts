import { UserProfile } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const productTelemetryContextSchema = z.strictObject({
  establishment_id: z.string().min(1),
  role: z.enum(UserProfile),
})
