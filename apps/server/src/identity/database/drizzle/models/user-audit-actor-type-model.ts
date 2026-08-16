import {
  UserAuditActorType,
  type UserAuditActorType as UserAuditActorTypeValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const userAuditActorTypeModel = pgEnum(
  'user_audit_actor_type',
  Object.values(UserAuditActorType) as [
    UserAuditActorTypeValue,
    ...UserAuditActorTypeValue[],
  ],
)
