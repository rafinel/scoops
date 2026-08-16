export const IDENTITY_REPOSITORIES = {
  database: Symbol('IDENTITY_REPOSITORIES.database'),
  establishments: Symbol('IDENTITY_REPOSITORIES.establishments'),
  registrationAttempts: Symbol('IDENTITY_REPOSITORIES.registrationAttempts'),
  users: Symbol('IDENTITY_REPOSITORIES.users'),
  userAuditRecords: Symbol('IDENTITY_REPOSITORIES.userAuditRecords'),
  establishmentAuditRecords: Symbol('IDENTITY_REPOSITORIES.establishmentAuditRecords'),
} as const
