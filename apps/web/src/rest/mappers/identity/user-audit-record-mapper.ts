import type { UserAuditRecord } from '@scoops/core/identity/domain/entities'

import { IdentityDateMapper } from './date-mapper'

export type UserAuditRecordJson = Omit<UserAuditRecord, 'occurredAt'> & {
  occurredAt: string
}

export const UserAuditRecordMapper = (response: UserAuditRecordJson): UserAuditRecord => {
  return {
    ...response,
    occurredAt: IdentityDateMapper(response.occurredAt, 'Unexpected user audit response'),
  }
}
