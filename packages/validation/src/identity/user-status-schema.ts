import { UserStatus } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const userStatusSchema = z.enum(UserStatus)
