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
    createdAt: IdentityDateMapper(response.createdAt, 'Resposta inesperada do usuário'),
    updatedAt: IdentityDateMapper(response.updatedAt, 'Resposta inesperada do usuário'),
    lastAccessAt: OptionalIdentityDateMapper(
      response.lastAccessAt,
      'Resposta inesperada do usuário',
    ),
  }
}
