import { OnboardingExpiredError } from '#identity/domain/errors/onboarding-expired-error.ts'
import type { PendingIceCreamShopOnboarding } from '#identity/domain/structures/pending-ice-cream-shop-onboarding.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

export class GetIceCreamShopOnboardingUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingTokenProvider: OnboardingTokenProvider,
  ) {}

  async execute(request: {
    continuationToken: string
  }): Promise<PendingIceCreamShopOnboarding> {
    const now = this.datetimeProvider.now()
    const tokenHash = this.onboardingTokenProvider.hash(request.continuationToken)
    return this.database.run(
      async ({ registrationAttemptsRepository, establishmentsRepository }) => {
        const attempt =
          await registrationAttemptsRepository.findPendingByTokenHash(tokenHash)
        if (!attempt || attempt.status !== RegistrationAttemptStatus.Pending) {
          throw new NotFoundError('Onboarding not found')
        }
        if (now.getTime() >= attempt.expiresAt.getTime())
          throw new OnboardingExpiredError()
        const establishment = await establishmentsRepository.findById(
          attempt.establishmentId,
        )
        if (!establishment) throw new NotFoundError('Onboarding not found')
        return {
          establishmentName: establishment.name,
          managerName: attempt.name,
          email: attempt.email,
          expiresAt: attempt.expiresAt,
        }
      },
    )
  }
}
