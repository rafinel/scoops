import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'
import { EstablishmentFaker, UserFaker } from '#identity/domain/entities/fakers/index.ts'
import { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import { ResolveAuthenticatedUserUseCase } from '#identity/use-cases/resolve-authenticated-user-use-case.ts'

describe('Resolve Authenticated User Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let scope: IdentityDatabaseScope
  let usersRepository: MockProxy<UsersRepository>
  let establishmentsRepository: MockProxy<EstablishmentsRepository>
  let useCase: ResolveAuthenticatedUserUseCase

  beforeEach(() => {
    database = mock<IdentityDatabase>()
    usersRepository = mock<UsersRepository>()
    establishmentsRepository = mock<EstablishmentsRepository>()
    scope = {
      usersRepository,
      establishmentsRepository,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
    }
    database.run.mockImplementation((operation) => operation(scope))
    useCase = new ResolveAuthenticatedUserUseCase(database)
  })

  it('returns a safe account for active local access', async () => {
    const user = UserFaker.fake({ profile: 'manager' })
    const establishment = EstablishmentFaker.fake({ id: user.establishmentId })
    usersRepository.findByProviderSubject.mockResolvedValue(user)
    establishmentsRepository.findById.mockResolvedValue(establishment)

    await expect(useCase.execute({ providerSubject: user.id })).resolves.toEqual({
      id: user.id,
      establishmentId: user.establishmentId,
      name: user.name,
      email: user.email,
      profile: user.profile,
    })
    expect(usersRepository.findByProviderSubject).toHaveBeenCalledWith(user.id)
    expect(establishmentsRepository.findById).toHaveBeenCalledWith(user.establishmentId)
  })

  it.each([
    ['missing', undefined],
    ['pending', UserFaker.fake({ status: UserStatus.Pending })],
    ['inactive', UserFaker.fake({ status: UserStatus.Inactive })],
  ])('returns undefined for a %s local user', async (_description, user) => {
    usersRepository.findByProviderSubject.mockResolvedValue(user)

    await expect(
      useCase.execute({ providerSubject: 'provider-subject' }),
    ).resolves.toBeUndefined()
    expect(establishmentsRepository.findById).not.toHaveBeenCalled()
  })

  it.each([
    ['missing', undefined],
    ['deleted', EstablishmentFaker.fake({ status: EstablishmentStatus.Deleted })],
  ])('returns undefined for a %s establishment', async (_description, establishment) => {
    const user = UserFaker.fake()
    usersRepository.findByProviderSubject.mockResolvedValue(user)
    establishmentsRepository.findById.mockResolvedValue(establishment)

    await expect(useCase.execute({ providerSubject: user.id })).resolves.toBeUndefined()
    expect(establishmentsRepository.findById).toHaveBeenCalledWith(user.establishmentId)
  })

  it('uses the provider subject for bootstrap and derives establishment scope from the user', async () => {
    const user = UserFaker.fake({ id: 'provider-subject' })
    usersRepository.findByProviderSubject.mockResolvedValue(user)
    establishmentsRepository.findById.mockResolvedValue(
      EstablishmentFaker.fake({ id: user.establishmentId }),
    )

    await useCase.execute({ providerSubject: user.id })

    expect(usersRepository.findByProviderSubject).toHaveBeenCalledWith('provider-subject')
    expect(establishmentsRepository.findById).toHaveBeenCalledWith(user.establishmentId)
    expect(usersRepository.findByProviderSubject).toHaveBeenCalledTimes(1)
  })
})
