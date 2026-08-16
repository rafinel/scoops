import {
  UserAuditAction,
  type UserAuditAction as UserAuditActionValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const userAuditActionModel = pgEnum(
  'user_audit_action',
  Object.values(UserAuditAction) as [UserAuditActionValue, ...UserAuditActionValue[]],
)
