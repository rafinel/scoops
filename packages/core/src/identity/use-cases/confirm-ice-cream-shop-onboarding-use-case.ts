import type { AuthUser } from '#identity/domain/structures/auth-user.ts'
import { OnboardingExpiredError } from '#identity/domain/errors/onboarding-expired-error.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { confirmationToken: string }

export class ConfirmIceCreamShopOnboardingUseCase implements UseCase<Request, AuthUser> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingIdentityProvider: OnboardingIdentityProvider,
  ) {}

  async execute(request: Request): Promise<AuthUser> {
    const authUser = await this.onboardingIdentityProvider.inspectOnboardingConfirmation(
      request.confirmationToken,
    )
    if (!authUser) throw new NotFoundError('Onboarding not found')

    const now = this.datetimeProvider.now()
    await this.database.run(async (scope) => {
      const user = await scope.usersRepository.findByProviderSubject(authUser.id)
      if (!user || user.email !== authUser.email.trim().toLowerCase()) {
        throw new NotFoundError('Onboarding not found')
      }
      const attempt = await scope.registrationAttemptsRepository.findByUserId(user.id)
      if (!attempt) throw new NotFoundError('Onboarding not found')
      if (attempt.status === RegistrationAttemptStatus.Confirmed) return
      if (attempt.status !== RegistrationAttemptStatus.Pending)
        throw new NotFoundError('Onboarding not found')
      if (now.getTime() >= attempt.expiresAt.getTime()) throw new OnboardingExpiredError()
      const establishment = await scope.establishmentsRepository.findById(
        attempt.establishmentId,
      )
      if (!establishment) throw new NotFoundError('Onboarding not found')
      await scope.establishmentsRepository.replace(establishment.id, {
        status: EstablishmentStatus.Active,
        activatedAt: now,
        updatedAt: now,
      })
      await scope.usersRepository.replace(user.establishmentId, user.id, {
        status: UserStatus.Active,
        updatedAt: now,
      })
      await scope.registrationAttemptsRepository.replace(attempt.id, {
        status: RegistrationAttemptStatus.Confirmed,
        updatedAt: now,
      })
    })

    return this.onboardingIdentityProvider.completeOnboardingConfirmation(
      request.confirmationToken,
    )
  }
}
