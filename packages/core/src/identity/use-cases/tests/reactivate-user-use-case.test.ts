import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ReactivateUserUseCase } from '#identity/use-cases/reactivate-user-use-case.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type { IdentityDatabaseScope } from '#identity/interfaces/identity-database.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'

describe('Reactivate User Use Case', () => {
  it('returns a neutral not-found error for an unknown target', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const scope: IdentityDatabaseScope = {
      usersRepository,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    usersRepository.findByIdInEstablishment.mockResolvedValue(undefined)
    const useCase = new ReactivateUserUseCase(database, mock<DatetimeProvider>())
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Manager }),
        userId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
