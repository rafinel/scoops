import { mock, type MockProxy } from 'vitest-mock-extended'
import { beforeEach, describe, expect, it } from 'vitest'
import { UserFaker } from '#identity/domain/entities/fakers/user-faker.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { OnboardingConfirmationPreparedEvent } from '#identity/domain/events/onboarding-confirmation-prepared-event.ts'
import { RegisterIceCreamShopUseCase } from '#identity/use-cases/register-ice-cream-shop-use-case.ts'

describe('Register Ice Cream Shop Use Case', () => {
  let database: MockProxy<IdentityDatabase>
  let usersRepository: MockProxy<UsersRepository>
  let registrationAttemptsRepository: MockProxy<RegistrationAttemptsRepository>
  let establishmentsRepository: MockProxy<EstablishmentsRepository>
  let provider: MockProxy<OnboardingIdentityProvider>
  let tokenProvider: MockProxy<OnboardingTokenProvider>
  let identifierProvider: MockProxy<OnboardingIdentifierProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let scope: IdentityDatabaseScope
  let useCase: RegisterIceCreamShopUseCase
  let broker: MockProxy<Broker>

  beforeEach(() => {
    database = mock<IdentityDatabase>()
    usersRepository = mock<UsersRepository>()
    registrationAttemptsRepository = mock<RegistrationAttemptsRepository>()
    establishmentsRepository = mock<EstablishmentsRepository>()
    provider = mock<OnboardingIdentityProvider>()
    tokenProvider = mock<OnboardingTokenProvider>()
    identifierProvider = mock<OnboardingIdentifierProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    broker = mock<Broker>()
    scope = { usersRepository, registrationAttemptsRepository, establishmentsRepository }
    database.run.mockImplementation((operation) => operation(scope))
    datetimeProvider.now.mockReturnValue(new Date('2026-01-01T00:00:00.000Z'))
    tokenProvider.issue.mockReturnValue({
      token: 'continuation',
      hash: 'continuation-hash',
    })
    identifierProvider.generate
      .mockReturnValueOnce('establishment-id')
      .mockReturnValueOnce('attempt-id')
    provider.registerPendingIdentity.mockResolvedValue({
      authUser: {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'maria@example.com',
      },
      event: new OnboardingConfirmationPreparedEvent({
        userId: '00000000-0000-0000-0000-000000000003',
        email: 'maria@example.com',
        name: 'Maria',
        actionUrl: 'http://localhost/onboarding/confirm?confirmationToken=continuation',
        expiresAt: '2026-01-08T00:00:00.000Z',
        occurredAt: '2026-01-01T00:00:00.000Z',
      }),
    })
    usersRepository.findByEmail.mockResolvedValue(undefined)
    registrationAttemptsRepository.findActiveByEmail.mockResolvedValue(undefined)
    establishmentsRepository.add.mockImplementation(async (input) => ({ ...input }))
    usersRepository.add.mockImplementation(async (input) => ({ ...input }))
    registrationAttemptsRepository.add.mockImplementation(async (input) => ({ ...input }))
    useCase = new RegisterIceCreamShopUseCase(
      database,
      datetimeProvider,
      tokenProvider,
      identifierProvider,
      provider,
      broker,
    )
  })

  it('creates a pending establishment, Manager and continuation snapshot', async () => {
    await expect(
      useCase.execute({
        establishmentName: '  Scoops  ',
        managerName: '  Maria  ',
        email: ' Maria@Example.COM ',
        password: 'password123',
        confirmationRedirectBaseUrl: 'http://localhost/onboarding/confirm',
      }),
    ).resolves.toEqual({
      continuationToken: 'continuation',
      onboarding: {
        establishmentName: 'Scoops',
        managerName: 'Maria',
        email: 'maria@example.com',
        expiresAt: new Date('2026-01-08T00:00:00.000Z'),
      },
    })
    expect(provider.registerPendingIdentity).toHaveBeenCalledWith({
      email: 'maria@example.com',
      password: 'password123',
      name: 'Maria',
      confirmationRedirectTo:
        'http://localhost/onboarding/confirm?confirmationToken=continuation',
    })
    expect(registrationAttemptsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '00000000-0000-0000-0000-000000000003',
        tokenHash: 'continuation-hash',
      }),
    )
  })

  it('rejects an email already used locally before calling the provider', async () => {
    usersRepository.findByEmail.mockResolvedValue(
      UserFaker.fake({ email: 'maria@example.com' }),
    )
    await expect(
      useCase.execute({
        establishmentName: 'Scoops',
        managerName: 'Maria',
        email: 'maria@example.com',
        password: 'password123',
        confirmationRedirectBaseUrl: 'http://localhost/onboarding/confirm',
      }),
    ).rejects.toThrow('email address is unavailable')
    expect(provider.registerPendingIdentity).not.toHaveBeenCalled()
  })
})
