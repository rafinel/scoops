import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { RequestPasswordRecoveryUseCase } from '#identity/use-cases/request-password-recovery-use-case.ts'
import { PasswordRecoveryPreparedEvent } from '#identity/domain/events/password-recovery-prepared-event.ts'
import { AuthenticationMessageRateLimitedError } from '#identity/domain/errors/authentication-message-rate-limited-error.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import { UserFaker } from '#identity/domain/entities/fakers/user-faker.ts'
import { UserAuditRecordFaker } from '#identity/domain/entities/fakers/user-audit-record-faker.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { PasswordRecoveryIdentityProvider } from '#identity/interfaces/password-recovery-identity-provider.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { UserAuditRecordsRepository } from '#identity/interfaces/user-audit-records-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'

describe('Request password recovery use case', () => {
  it('prepares, audits and publishes recovery for a known user', async () => {
    const database = mock<IdentityDatabase>()
    const users = mock<UsersRepository>()
    const audits = mock<UserAuditRecordsRepository>()
    const provider = mock<PasswordRecoveryIdentityProvider>()
    const broker = mock<Broker>()
    const now = new Date('2026-01-02T00:00:00.000Z')
    const user = UserFaker.fake({
      id: '00000000-0000-0000-0000-000000000001',
      establishmentId: '00000000-0000-0000-0000-000000000002',
      name: 'Maria',
      email: 'maria@example.com',
    })
    const event = new PasswordRecoveryPreparedEvent({
      userId: user.id,
      email: user.email,
      name: user.name,
      actionUrl: 'https://example.com/reset-password?token=recovery-token',
      expiresAt: '2026-01-02T01:00:00.000Z',
      occurredAt: now.toISOString(),
    })
    const scope: IdentityDatabaseScope = {
      usersRepository: users,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      userAuditRecordsRepository: audits,
    }
    database.run.mockImplementation((operation) => operation(scope))
    users.findByEmail.mockResolvedValue(user)
    provider.preparePasswordRecovery.mockResolvedValue(event)
    audits.add.mockResolvedValue(UserAuditRecordFaker.fake())
    const useCase = new RequestPasswordRecoveryUseCase(
      database,
      { now: () => now } satisfies DatetimeProvider,
      provider,
      broker,
    )

    await expect(
      useCase.execute({
        email: ' MARIA@EXAMPLE.COM ',
        recoveryRedirectTo: 'https://example.com/reset-password',
      }),
    ).resolves.toBeUndefined()
    expect(provider.preparePasswordRecovery).toHaveBeenCalledWith({
      providerSubject: user.id,
      recoveryRedirectTo: 'https://example.com/reset-password',
    })
    expect(audits.add).toHaveBeenCalledWith({
      id: `${user.id}:${now.toISOString()}:password-recovery`,
      establishmentId: user.establishmentId,
      affectedUserId: user.id,
      affectedUserName: user.name,
      actorType: UserAuditActorType.System,
      actorName: 'System',
      action: UserAuditAction.PasswordRecoveryInitiated,
      occurredAt: now,
    })
    expect(broker.publish).toHaveBeenCalledWith(event)
  })

  it('does not enumerate an unknown email', async () => {
    const database = mock<IdentityDatabase>()
    const users = mock<UsersRepository>()
    const provider = mock<PasswordRecoveryIdentityProvider>()
    const broker = mock<Broker>()
    const audits = mock<UserAuditRecordsRepository>()
    const scope: IdentityDatabaseScope = {
      usersRepository: users,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      userAuditRecordsRepository: audits,
    }
    database.run.mockImplementation((operation) => operation(scope))
    users.findByEmail.mockResolvedValue(undefined)
    const useCase = new RequestPasswordRecoveryUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      provider,
      broker,
    )

    await expect(
      useCase.execute({
        email: 'unknown@example.com',
        recoveryRedirectTo: 'https://example.com/reset-password',
      }),
    ).resolves.toBeUndefined()
    expect(provider.preparePasswordRecovery).not.toHaveBeenCalled()
    expect(audits.add).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('propagates the provider quota error without writing an audit', async () => {
    const database = mock<IdentityDatabase>()
    const users = mock<UsersRepository>()
    const audits = mock<UserAuditRecordsRepository>()
    const provider = mock<PasswordRecoveryIdentityProvider>()
    const broker = mock<Broker>()
    const user = UserFaker.fake({
      id: '00000000-0000-0000-0000-000000000003',
      email: 'maria@example.com',
    })
    const scope: IdentityDatabaseScope = {
      usersRepository: users,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      userAuditRecordsRepository: audits,
    }
    database.run.mockImplementation((operation) => operation(scope))
    users.findByEmail.mockResolvedValue(user)
    provider.preparePasswordRecovery.mockRejectedValue(
      new AuthenticationMessageRateLimitedError(),
    )
    const useCase = new RequestPasswordRecoveryUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      provider,
      broker,
    )

    await expect(
      useCase.execute({
        email: user.email,
        recoveryRedirectTo: 'https://example.com/reset-password',
      }),
    ).rejects.toBeInstanceOf(AuthenticationMessageRateLimitedError)
    expect(audits.add).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('propagates broker failure so the recovery transaction can roll back', async () => {
    const database = mock<IdentityDatabase>()
    const users = mock<UsersRepository>()
    const audits = mock<UserAuditRecordsRepository>()
    const provider = mock<PasswordRecoveryIdentityProvider>()
    const broker = mock<Broker>()
    const user = UserFaker.fake({
      id: '00000000-0000-0000-0000-000000000004',
      email: 'maria@example.com',
    })
    const event = new PasswordRecoveryPreparedEvent({
      userId: user.id,
      email: user.email,
      name: user.name,
      actionUrl: 'https://example.com/reset-password?token=recovery-token',
      expiresAt: '2026-01-02T01:00:00.000Z',
      occurredAt: '2026-01-02T00:00:00.000Z',
    })
    const scope: IdentityDatabaseScope = {
      usersRepository: users,
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      userAuditRecordsRepository: audits,
    }
    database.run.mockImplementation((operation) => operation(scope))
    users.findByEmail.mockResolvedValue(user)
    provider.preparePasswordRecovery.mockResolvedValue(event)
    audits.add.mockResolvedValue(UserAuditRecordFaker.fake())
    broker.publish.mockRejectedValue(new Error('outbox unavailable'))
    const useCase = new RequestPasswordRecoveryUseCase(
      database,
      { now: () => new Date('2026-01-02T00:00:00.000Z') },
      provider,
      broker,
    )

    await expect(
      useCase.execute({
        email: user.email,
        recoveryRedirectTo: 'https://example.com/reset-password',
      }),
    ).rejects.toThrow('outbox unavailable')
    expect(audits.add).toHaveBeenCalled()
    expect(broker.publish).toHaveBeenCalledWith(event)
  })
})
