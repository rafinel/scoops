import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { UserAuditRecordsRepository } from '#identity/interfaces/user-audit-records-repository.ts'
import type { EstablishmentAuditRecordsRepository } from '#identity/interfaces/establishment-audit-records-repository.ts'
import type { AuthenticationSessionsRepository } from '#identity/interfaces/authentication-sessions-repository.ts'

export type IdentityDatabaseScope = {
  establishmentsRepository: EstablishmentsRepository
  registrationAttemptsRepository: RegistrationAttemptsRepository
  usersRepository: UsersRepository
  userAuditRecordsRepository?: UserAuditRecordsRepository
  establishmentAuditRecordsRepository?: EstablishmentAuditRecordsRepository
  authenticationSessionsRepository?: AuthenticationSessionsRepository
}

export interface IdentityDatabase {
  run<Result>(
    operation: (scope: IdentityDatabaseScope) => Promise<Result>,
  ): Promise<Result>
}
