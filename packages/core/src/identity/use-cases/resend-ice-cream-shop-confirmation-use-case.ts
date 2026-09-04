import { OnboardingExpiredError } from '#identity/domain/errors/onboarding-expired-error.ts'
import type { PendingIceCreamShopOnboarding } from '#identity/domain/structures/pending-ice-cream-shop-onboarding.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { confirmationRedirectUrl } from '#identity/use-cases/confirmation-redirect.ts'

type Request = {
  continuationToken: string
  confirmationRedirectBaseUrl: string
}

export class ResendIceCreamShopConfirmationUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingTokenProvider: OnboardingTokenProvider,
    private readonly onboardingIdentityProvider: OnboardingIdentityProvider,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<PendingIceCreamShopOnboarding> {
    const now = this.datetimeProvider.now()
    const tokenHash = this.onboardingTokenProvider.hash(request.continuationToken)
    const confirmation = this.onboardingTokenProvider.issue()
    return this.database.run(async (scope) => {
      const attempt =
        await scope.registrationAttemptsRepository.findPendingByTokenHash(tokenHash)
      if (!attempt || attempt.status !== RegistrationAttemptStatus.Pending)
        throw new NotFoundError('Onboarding not found')
      if (now.getTime() >= attempt.expiresAt.getTime()) throw new OnboardingExpiredError()
      const establishment = await scope.establishmentsRepository.findById(
        attempt.establishmentId,
      )
      if (!establishment) throw new NotFoundError('Onboarding not found')
      const event = await this.onboardingIdentityProvider.prepareOnboardingConfirmation({
        providerSubject: attempt.userId,
        confirmationRedirectTo: confirmationRedirectUrl(
          request.confirmationRedirectBaseUrl,
          confirmation.token,
        ),
      })
      await scope.registrationAttemptsRepository.replace(attempt.id, {
        confirmationTokenHash: confirmation.hash,
        updatedAt: now,
      })
      await this.broker?.publish(event)
      return {
        establishmentName: establishment.name,
        managerName: attempt.name,
        email: attempt.email,
        expiresAt: attempt.expiresAt,
      }
    })
  }
}
