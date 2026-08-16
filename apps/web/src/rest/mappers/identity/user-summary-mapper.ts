import type { User } from '@scoops/core/identity/domain/entities'

import { IdentityDateMapper, OptionalIdentityDateMapper } from './date-mapper'

export type UserSummaryJson = Omit<User, 'createdAt' | 'updatedAt' | 'lastAccessAt'> & {
  createdAt: string
  lastAccessAt?: string
}

export type UserSummary = Pick<
  User,
  'id' | 'name' | 'email' | 'profile' | 'status' | 'lastAccessAt' | 'createdAt'
>

export const UserSummaryMapper = (response: UserSummaryJson): UserSummary => {
  return {
    ...response,
    createdAt: IdentityDateMapper(response.createdAt, 'Unexpected users response'),
    lastAccessAt: OptionalIdentityDateMapper(
      response.lastAccessAt,
      'Unexpected users response',
    ),
  }
}
