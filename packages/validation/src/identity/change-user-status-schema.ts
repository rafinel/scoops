import { UserStatus } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const changeUserStatusSchema = z
  .object({ status: z.enum([UserStatus.Active, UserStatus.Inactive]) })
  .strict()
