import { Module } from '@nestjs/common'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import { DrizzleIdentityDatabase } from '@/identity/database/drizzle/drizzle-identity-database'
import { DrizzleEstablishmentsRepository } from '@/identity/database/drizzle/repositories/drizzle-establishments-repository'
import { DrizzleRegistrationAttemptsRepository } from '@/identity/database/drizzle/repositories/drizzle-registration-attempts-repository'
import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories/drizzle-users-repository'
import { DrizzleUserAuditRecordsRepository } from '@/identity/database/drizzle/repositories/drizzle-user-audit-records-repository'
import { DrizzleEstablishmentAuditRecordsRepository } from '@/identity/database/drizzle/repositories/drizzle-establishment-audit-records-repository'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleEstablishmentsRepository,
    DrizzleRegistrationAttemptsRepository,
    DrizzleUsersRepository,
    DrizzleUserAuditRecordsRepository,
    DrizzleEstablishmentAuditRecordsRepository,
    DrizzleIdentityDatabase,
    IdentitySeeder,
    {
      provide: IDENTITY_REPOSITORIES.database,
      useExisting: DrizzleIdentityDatabase,
    },
    {
      provide: IDENTITY_REPOSITORIES.establishments,
      useExisting: DrizzleEstablishmentsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.registrationAttempts,
      useExisting: DrizzleRegistrationAttemptsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.users,
      useExisting: DrizzleUsersRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.userAuditRecords,
      useExisting: DrizzleUserAuditRecordsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.establishmentAuditRecords,
      useExisting: DrizzleEstablishmentAuditRecordsRepository,
    },
  ],
  exports: [
    IDENTITY_REPOSITORIES.database,
    IDENTITY_REPOSITORIES.establishments,
    IDENTITY_REPOSITORIES.registrationAttempts,
    IDENTITY_REPOSITORIES.users,
    IDENTITY_REPOSITORIES.userAuditRecords,
    IDENTITY_REPOSITORIES.establishmentAuditRecords,
    IdentitySeeder,
  ],
})
export class IdentityDatabaseModule {}
