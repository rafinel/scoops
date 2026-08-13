import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

export class ExpireIceCreamShopOnboardingsUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingIdentityProvider: OnboardingIdentityProvider,
  ) {}

  async execute(request: {
    limit: number
    claimToken: string
  }): Promise<{ expired: number; removed: number; failed: number }> {
    const now = this.datetimeProvider.now()
    const staleBefore = new Date(now.getTime() - 15 * 60 * 1000)
    const claims = await this.database.run(({ registrationAttemptsRepository }) =>
      registrationAttemptsRepository.claimForCleanup({
        cutoff: now,
        staleBefore,
        claimedAt: now,
        claimToken: request.claimToken,
        limit: request.limit,
      }),
    )
    let expired = 0
    let removed = 0
    let failed = 0
    for (const claim of claims) {
      if (claim.status !== RegistrationAttemptStatus.Expired) {
        if (!claim.supersededProviderSubject) continue
        try {
          await this.onboardingIdentityProvider.removeIdentity(
            claim.supersededProviderSubject,
          )
          await this.database.run(({ registrationAttemptsRepository }) =>
            registrationAttemptsRepository.clearSupersededProviderSubject({
              attemptId: claim.id,
              claimToken: request.claimToken,
              supersededProviderSubject: claim.supersededProviderSubject as string,
              updatedAt: now,
            }),
          )
          removed++
        } catch {
          failed++
        }
        continue
      }
      expired++
      try {
        await this.onboardingIdentityProvider.removeIdentity(claim.userId)
        if (claim.supersededProviderSubject) {
          await this.onboardingIdentityProvider.removeIdentity(
            claim.supersededProviderSubject,
          )
        }
        await this.database.run(async (scope) => {
          await scope.establishmentsRepository.remove(claim.establishmentId)
        })
        removed++
      } catch {
        failed++
        await this.database
          .run(({ registrationAttemptsRepository }) =>
            registrationAttemptsRepository.clearCleanupClaim({
              attemptId: claim.id,
              claimToken: request.claimToken,
              updatedAt: now,
            }),
          )
          .catch(() => false)
      }
    }
    return { expired, removed, failed }
  }
}
