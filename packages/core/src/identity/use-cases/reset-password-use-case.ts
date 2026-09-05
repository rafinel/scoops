import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { PasswordRecoveryIdentityProvider } from '#identity/interfaces/password-recovery-identity-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { token: string; password: string }

export class ResetPasswordUseCase implements UseCase<Request, void> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly provider: PasswordRecoveryIdentityProvider,
  ) {}

  async execute(request: Request): Promise<void> {
    await this.database.run(
      async ({ authenticationSessionsRepository }: IdentityDatabaseRepositories) => {
        const authUser = await this.provider.resetPassword({
          token: request.token,
          password: request.password,
        })
        await authenticationSessionsRepository?.removeAllByProviderSubject(authUser.id)
      },
    )
  }
}
