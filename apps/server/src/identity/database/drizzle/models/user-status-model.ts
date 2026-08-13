import {
  UserStatus,
  type UserStatus as UserStatusValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const userStatusModel = pgEnum(
  'user_status',
  Object.values(UserStatus) as [UserStatusValue, ...UserStatusValue[]],
)
