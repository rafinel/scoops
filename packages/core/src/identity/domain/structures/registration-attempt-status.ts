export const RegistrationAttemptStatus = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
  Expired: 'expired',
} as const

export type RegistrationAttemptStatus =
  (typeof RegistrationAttemptStatus)[keyof typeof RegistrationAttemptStatus]
