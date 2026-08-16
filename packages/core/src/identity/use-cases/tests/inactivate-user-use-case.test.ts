import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { InactivateUserUseCase } from '#identity/use-cases/inactivate-user-use-case.ts'
import { UserStatusChangeNotAllowedError } from '#identity/domain/errors/user-status-change-not-allowed-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type { IdentityDatabaseScope } from '#identity/interfaces/identity-database.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'

describe('Inactivate User Use Case', () => {
  it('rejects self-inactivation before reading the target', async () => {
    const database = mock<IdentityDatabase>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const scope: IdentityDatabaseScope = {
      usersRepository: mock<UsersRepository>(),
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    const useCase = new InactivateUserUseCase(database, mock<DatetimeProvider>())
    await expect(useCase.execute({ actor, userId: actor.id })).rejects.toBeInstanceOf(
      UserStatusChangeNotAllowedError,
    )
    expect(database.run).toHaveBeenCalledTimes(1)
  })
})
