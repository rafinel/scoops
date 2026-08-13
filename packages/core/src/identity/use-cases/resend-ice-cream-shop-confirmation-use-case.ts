import { OnboardingExpiredError } from '#identity/domain/errors/onboarding-expired-error.ts'
import type { PendingIceCreamShopOnboarding } from '#identity/domain/structures/pending-ice-cream-shop-onboarding.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { confirmationRedirectUrl } from '#identity/use-cases/confirmation-redirect.ts'

export class ResendIceCreamShopConfirmationUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingTokenProvider: OnboardingTokenProvider,
    private readonly onboardingIdentityProvider: OnboardingIdentityProvider,
  ) {}

  async execute(request: {
    continuationToken: string
    confirmationRedirectBaseUrl: string
  }): Promise<PendingIceCreamShopOnboarding> {
    const now = this.datetimeProvider.now()
    const tokenHash = this.onboardingTokenProvider.hash(request.continuationToken)
    const pending = await this.database.run(
      async ({ registrationAttemptsRepository, establishmentsRepository }) => {
        const attempt =
          await registrationAttemptsRepository.findPendingByTokenHash(tokenHash)
        if (!attempt || attempt.status !== RegistrationAttemptStatus.Pending)
          throw new NotFoundError('Onboarding not found')
        if (now.getTime() >= attempt.expiresAt.getTime())
          throw new OnboardingExpiredError()
        const establishment = await establishmentsRepository.findById(
          attempt.establishmentId,
        )
        if (!establishment) throw new NotFoundError('Onboarding not found')
        return { attempt, establishment }
      },
    )
    const confirmation = this.onboardingTokenProvider.issue()
    await this.onboardingIdentityProvider.resendConfirmation({
      email: pending.attempt.email,
      confirmationRedirectTo: confirmationRedirectUrl(
        request.confirmationRedirectBaseUrl,
        confirmation.token,
      ),
    })
    await this.database.run(async ({ registrationAttemptsRepository }) => {
      const current =
        await registrationAttemptsRepository.findPendingByTokenHash(tokenHash)
      if (!current || current.id !== pending.attempt.id)
        throw new NotFoundError('Onboarding not found')
      await registrationAttemptsRepository.replace(current.id, {
        confirmationTokenHash: confirmation.hash,
        updatedAt: now,
      })
    })
    return {
      establishmentName: pending.establishment.name,
      managerName: pending.attempt.name,
      email: pending.attempt.email,
      expiresAt: pending.attempt.expiresAt,
    }
  }
}
