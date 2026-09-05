import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { UserAuditRecordsRepository } from '#identity/interfaces/user-audit-records-repository.ts'
import type { EstablishmentAuditRecordsRepository } from '#identity/interfaces/establishment-audit-records-repository.ts'
import type { AuthenticationSessionsRepository } from '#identity/interfaces/authentication-sessions-repository.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'

export type IdentityDatabaseRepositories = {
  establishmentsRepository: EstablishmentsRepository
  registrationAttemptsRepository: RegistrationAttemptsRepository
  usersRepository: UsersRepository
  userAuditRecordsRepository?: UserAuditRecordsRepository
  establishmentAuditRecordsRepository?: EstablishmentAuditRecordsRepository
  authenticationSessionsRepository?: AuthenticationSessionsRepository
  eventsRepository: Pick<EventsRepository, 'add'>
}

export interface IdentityDatabase {
  run<Result>(
    operation: (scope: IdentityDatabaseRepositories) => Promise<Result>,
  ): Promise<Result>
}
