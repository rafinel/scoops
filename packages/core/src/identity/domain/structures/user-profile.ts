export const UserProfile = {
  Manager: 'manager',
  Operator: 'operator',
} as const

export type UserProfile = (typeof UserProfile)[keyof typeof UserProfile]
