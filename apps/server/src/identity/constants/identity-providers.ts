export const IDENTITY_PROVIDERS = {
  betterAuth: Symbol('IDENTITY_PROVIDERS.betterAuth'),
  betterAuthSessionVerifier: Symbol('IDENTITY_PROVIDERS.betterAuthSessionVerifier'),
  authIdentity: Symbol('IDENTITY_PROVIDERS.authIdentity'),
  onboardingIdentity: Symbol('IDENTITY_PROVIDERS.onboardingIdentity'),
  onboardingToken: Symbol('IDENTITY_PROVIDERS.onboardingToken'),
  onboardingIdentifier: Symbol('IDENTITY_PROVIDERS.onboardingIdentifier'),
  userAccessIdentity: Symbol('IDENTITY_PROVIDERS.userAccessIdentity'),
} as const
