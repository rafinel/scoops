import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ResetPasswordUseCase } from '#identity/use-cases/reset-password-use-case.ts'
import type {
  IdentityDatabase,
  IdentityDatabaseScope,
} from '#identity/interfaces/identity-database.ts'
import type { PasswordRecoveryIdentityProvider } from '#identity/interfaces/password-recovery-identity-provider.ts'
import type { AuthenticationSessionsRepository } from '#identity/interfaces/authentication-sessions-repository.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import type { EstablishmentsRepository } from '#identity/interfaces/establishments-repository.ts'
import type { RegistrationAttemptsRepository } from '#identity/interfaces/registration-attempts-repository.ts'

describe('Reset password use case', () => {
  it('resets the password and revokes every session for the account', async () => {
    const database = mock<IdentityDatabase>()
    const provider = mock<PasswordRecoveryIdentityProvider>()
    const sessions = mock<AuthenticationSessionsRepository>()
    const scope: IdentityDatabaseScope = {
      usersRepository: mock<UsersRepository>(),
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      authenticationSessionsRepository: sessions,
    }
    database.run.mockImplementation((operation) => operation(scope))
    provider.resetPassword.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'maria@example.com',
    })
    const useCase = new ResetPasswordUseCase(database, provider)

    await expect(
      useCase.execute({ token: 'recovery-token', password: 'password123' }),
    ).resolves.toBeUndefined()
    expect(provider.resetPassword).toHaveBeenCalledWith({
      token: 'recovery-token',
      password: 'password123',
    })
    expect(sessions.removeAllByProviderSubject).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
    )
  })

  it('does not revoke sessions when the provider rejects the reset', async () => {
    const database = mock<IdentityDatabase>()
    const provider = mock<PasswordRecoveryIdentityProvider>()
    const sessions = mock<AuthenticationSessionsRepository>()
    const scope: IdentityDatabaseScope = {
      usersRepository: mock<UsersRepository>(),
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      authenticationSessionsRepository: sessions,
    }
    database.run.mockImplementation((operation) => operation(scope))
    provider.resetPassword.mockRejectedValue(new Error('invalid recovery token'))
    const useCase = new ResetPasswordUseCase(database, provider)

    await expect(
      useCase.execute({ token: 'invalid-token', password: 'password123' }),
    ).rejects.toThrow('invalid recovery token')
    expect(sessions.removeAllByProviderSubject).not.toHaveBeenCalled()
  })

  it('propagates revocation failure so the reset transaction can roll back', async () => {
    const database = mock<IdentityDatabase>()
    const provider = mock<PasswordRecoveryIdentityProvider>()
    const sessions = mock<AuthenticationSessionsRepository>()
    const scope: IdentityDatabaseScope = {
      usersRepository: mock<UsersRepository>(),
      registrationAttemptsRepository: mock<RegistrationAttemptsRepository>(),
      establishmentsRepository: mock<EstablishmentsRepository>(),
      authenticationSessionsRepository: sessions,
    }
    database.run.mockImplementation((operation) => operation(scope))
    provider.resetPassword.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000002',
      email: 'maria@example.com',
    })
    sessions.removeAllByProviderSubject.mockRejectedValue(
      new Error('session store unavailable'),
    )
    const useCase = new ResetPasswordUseCase(database, provider)

    await expect(
      useCase.execute({ token: 'recovery-token', password: 'password123' }),
    ).rejects.toThrow('session store unavailable')
    expect(sessions.removeAllByProviderSubject).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000002',
    )
  })
})
