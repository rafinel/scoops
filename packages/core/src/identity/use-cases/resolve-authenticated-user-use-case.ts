import type { Account } from '#identity/domain/entities/account.ts'
import { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  providerSubject: string
}

export class ResolveAuthenticatedUserUseCase
  implements UseCase<Request, Account | undefined>
{
  constructor(private readonly database: IdentityDatabase) {}

  async execute(request: Request): Promise<Account | undefined> {
    return this.database.run(async (scope) => {
      const user = await scope.usersRepository.findByProviderSubject(
        request.providerSubject,
      )

      if (!user || user.status !== UserStatus.Active) return undefined

      const establishment = await scope.establishmentsRepository.findById(
        user.establishmentId,
      )

      if (!establishment || establishment.status !== EstablishmentStatus.Active) {
        return undefined
      }

      return {
        id: user.id,
        establishmentId: user.establishmentId,
        name: user.name,
        email: user.email,
        profile: user.profile,
      }
    })
  }
}
