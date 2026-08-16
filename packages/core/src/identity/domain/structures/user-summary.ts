import type { User } from '#identity/domain/entities/user.ts'

export type UserSummary = Pick<
  User,
  'id' | 'name' | 'email' | 'profile' | 'status' | 'lastAccessAt' | 'createdAt'
>
