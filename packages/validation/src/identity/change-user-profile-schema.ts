import { z } from 'zod'

import { userProfileSchema } from './user-profile-schema.ts'

export const changeUserProfileSchema = z.object({ profile: userProfileSchema }).strict()
