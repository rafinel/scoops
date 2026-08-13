import type { User } from '#identity/domain/entities/user.ts'
import { ProfileChangeNotAllowedError } from '#identity/domain/errors/profile-change-not-allowed-error.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { UserProfile as UserProfileValue } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import type { Account } from '#identity/domain/entities/account.ts'

type Request = {
  actor: Account
  userId: string
  profile: UserProfileValue
}

export class ChangeUserProfileUseCase implements UseCase<Request, User> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<User> {
    const updatedAt = this.datetimeProvider.now()

    return this.database.run(async (scope) => {
      if (request.actor.id === request.userId) {
        throw new ProfileChangeNotAllowedError()
      }

      const target = await scope.usersRepository.findByIdInEstablishment(
        request.actor.establishmentId,
        request.userId,
      )

      if (!target || target.establishmentId !== request.actor.establishmentId) {
        throw new NotFoundError('User not found')
      }

      if (target.profile === request.profile) return target

      const isDemotingActiveManager =
        target.status === UserStatus.Active &&
        target.profile === UserProfile.Manager &&
        request.profile === UserProfile.Operator

      if (isDemotingActiveManager) {
        const activeManagersCount = await scope.usersRepository.countActiveManagers(
          request.actor.establishmentId,
        )

        if (activeManagersCount === 1) {
          throw new ProfileChangeNotAllowedError()
        }
      }

      return scope.usersRepository.replace(
        request.actor.establishmentId,
        request.userId,
        {
          profile: request.profile,
          updatedAt,
        },
      )
    })
  }
}
