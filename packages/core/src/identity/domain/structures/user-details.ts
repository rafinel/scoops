import type { User } from '#identity/domain/entities/user.ts'
import type { UserAuditRecord } from '#identity/domain/entities/user-audit-record.ts'

export type UserDetails = {
  user: User
  auditRecords: readonly UserAuditRecord[]
}
