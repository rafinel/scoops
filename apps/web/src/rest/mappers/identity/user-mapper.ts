import type { User } from '@scoops/core/identity/domain/entities'

import { IdentityDateMapper, OptionalIdentityDateMapper } from './date-mapper'

export type UserJson = Omit<User, 'createdAt' | 'updatedAt' | 'lastAccessAt'> & {
  createdAt: string
  updatedAt: string
  lastAccessAt?: string
}

export const UserMapper = (response: UserJson): User => {
  return {
    ...response,
    createdAt: IdentityDateMapper(response.createdAt, 'Unexpected user response'),
    updatedAt: IdentityDateMapper(response.updatedAt, 'Unexpected user response'),
    lastAccessAt: OptionalIdentityDateMapper(
      response.lastAccessAt,
      'Unexpected user response',
    ),
  }
}
