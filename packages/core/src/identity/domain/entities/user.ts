import type { Entity } from '#shared/domain/entities/entity.ts'
import type { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { UserStatus } from '#identity/domain/structures/user-status.ts'

export type User = Entity & {
  establishmentId: string
  name: string
  email: string
  profile: UserProfile
  status: UserStatus
  lastAccessAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type UserCreate = Pick<
  User,
  | 'id'
  | 'establishmentId'
  | 'name'
  | 'email'
  | 'profile'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
>

export type UserUpdate = Partial<
  Pick<User, 'name' | 'email' | 'profile' | 'status' | 'lastAccessAt' | 'updatedAt'>
>
