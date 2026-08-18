import { UserProfile } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const userProfileSchema = z.enum(UserProfile)
