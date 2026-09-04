import {
  UserAuditAction,
  type UserAuditAction as UserAuditActionValue,
} from '@scoops/core/identity/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const USER_AUDIT_ACTION_VALUES = Object.values(UserAuditAction) as [
  UserAuditActionValue,
  ...UserAuditActionValue[],
]

export const userAuditActionModel = pgEnum('user_audit_action', USER_AUDIT_ACTION_VALUES)
