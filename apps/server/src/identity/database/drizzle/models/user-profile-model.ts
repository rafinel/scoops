import {
  UserProfile,
  type UserProfile as UserProfileValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const userProfileModel = pgEnum(
  'user_profile',
  Object.values(UserProfile) as [UserProfileValue, ...UserProfileValue[]],
)
