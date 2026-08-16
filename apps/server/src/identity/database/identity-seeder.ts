import type {
  EstablishmentCreate,
  UserCreate,
  UserRegistrationAttemptCreate,
} from '@scoops/core/identity/domain/entities'
import { Inject, Injectable } from '@nestjs/common'

import { IDENTITY_REPOSITORIES } from '@/identity/constants'
import type { EstablishmentsRepository } from '@scoops/core/identity/interfaces'
import type { RegistrationAttemptsRepository } from '@scoops/core/identity/interfaces'
import type { UsersRepository } from '@scoops/core/identity/interfaces'
import type { UserAuditRecordsRepository } from '@scoops/core/identity/interfaces'
import type { EstablishmentAuditRecordsRepository } from '@scoops/core/identity/interfaces'

export type IdentitySeed = {
  establishments: EstablishmentCreate[]
  users: UserCreate[]
  registrationAttempts: UserRegistrationAttemptCreate[]
}

@Injectable()
export class IdentitySeeder {
  constructor(
    @Inject(IDENTITY_REPOSITORIES.establishments)
    private readonly establishmentsRepository: EstablishmentsRepository,
    @Inject(IDENTITY_REPOSITORIES.users)
    private readonly usersRepository: UsersRepository,
    @Inject(IDENTITY_REPOSITORIES.registrationAttempts)
    private readonly registrationAttemptsRepository: RegistrationAttemptsRepository,
    @Inject(IDENTITY_REPOSITORIES.userAuditRecords)
    private readonly userAuditRecordsRepository: UserAuditRecordsRepository,
    @Inject(IDENTITY_REPOSITORIES.establishmentAuditRecords)
    private readonly establishmentAuditRecordsRepository: EstablishmentAuditRecordsRepository,
  ) {}

  async clear(): Promise<void> {
    await this.establishmentAuditRecordsRepository.removeAll()
    await this.userAuditRecordsRepository.removeAll()
    await this.registrationAttemptsRepository.removeAll()
    await this.usersRepository.removeAll()
    await this.establishmentsRepository.removeAll()
  }

  async run(seed: IdentitySeed): Promise<void> {
    await this.establishmentsRepository.addMany(seed.establishments)
    await this.usersRepository.addMany(seed.users)
    await this.registrationAttemptsRepository.addMany(seed.registrationAttempts)
  }
}
