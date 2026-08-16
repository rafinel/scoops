import type { UserDetails } from '@scoops/core/identity/domain/structures'
import { AppError } from '@scoops/core/shared/domain/errors'

import {
  UserAuditRecordMapper,
  type UserAuditRecordJson,
} from './user-audit-record-mapper'
import { UserMapper, type UserJson } from './user-mapper'

export type UserDetailsJson = {
  user: UserJson
  auditRecords: readonly UserAuditRecordJson[]
}

export const UserDetailsMapper = (response: UserDetailsJson): UserDetails => {
  if (!response?.user || !Array.isArray(response.auditRecords)) {
    throw new AppError('Unexpected user details response')
  }

  return {
    user: UserMapper(response.user),
    auditRecords: response.auditRecords.map((record) => UserAuditRecordMapper(record)),
  }
}
