export const UserStatus = {
  Pending: 'pending',
  Active: 'active',
  Inactive: 'inactive',
} as const

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]
