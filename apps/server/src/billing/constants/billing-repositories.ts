export const BILLING_REPOSITORIES = {
  acceptances: Symbol('BILLING_REPOSITORIES.acceptances'),
  charges: Symbol('BILLING_REPOSITORIES.charges'),
  database: Symbol('BILLING_REPOSITORIES.database'),
  fiscalDocuments: Symbol('BILLING_REPOSITORIES.fiscalDocuments'),
  profiles: Symbol('BILLING_REPOSITORIES.profiles'),
  providerEvents: Symbol('BILLING_REPOSITORIES.providerEvents'),
  subscriptions: Symbol('BILLING_REPOSITORIES.subscriptions'),
  trialEligibilities: Symbol('BILLING_REPOSITORIES.trialEligibilities'),
} as const
