export const RegistrationAttemptType = {
  EstablishmentOnboarding: 'establishment-onboarding',
  UserInvitation: 'user-invitation',
} as const

export type RegistrationAttemptType =
  (typeof RegistrationAttemptType)[keyof typeof RegistrationAttemptType]
