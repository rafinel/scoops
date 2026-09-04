import type { UserRegistrationAttempt } from '#identity/domain/entities/user-registration-attempt.ts'
import { OnboardingEmailUnavailableError } from '#identity/domain/errors/onboarding-email-unavailable-error.ts'
import { OnboardingExpiredError } from '#identity/domain/errors/onboarding-expired-error.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { PendingIceCreamShopOnboarding } from '#identity/domain/structures/pending-ice-cream-shop-onboarding.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { confirmationRedirectUrl } from '#identity/use-cases/confirmation-redirect.ts'

export class CorrectIceCreamShopOnboardingEmailUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingTokenProvider: OnboardingTokenProvider,
    private readonly onboardingIdentifierProvider: OnboardingIdentifierProvider,
    private readonly onboardingIdentityProvider: OnboardingIdentityProvider,
    private readonly broker?: Broker,
  ) {}

  async execute(request: {
    continuationToken: string
    email: string
    password: string
    confirmationRedirectBaseUrl: string
  }): Promise<PendingIceCreamShopOnboarding> {
    const now = this.datetimeProvider.now()
    const tokenHash = this.onboardingTokenProvider.hash(request.continuationToken)
    const email = request.email.trim().toLowerCase()
    const pending = await this.database.run(
      async ({ registrationAttemptsRepository, establishmentsRepository }) => {
        const attempt =
          await registrationAttemptsRepository.findPendingByTokenHash(tokenHash)
        if (!attempt || attempt.status !== RegistrationAttemptStatus.Pending)
          throw new NotFoundError('Onboarding not found')
        if (now.getTime() >= attempt.expiresAt.getTime())
          throw new OnboardingExpiredError()
        if (attempt.supersededProviderSubject)
          throw new ConflictError('Onboarding cleanup is pending')
        const establishment = await establishmentsRepository.findById(
          attempt.establishmentId,
        )
        if (!establishment) throw new NotFoundError('Onboarding not found')
        return { attempt, establishment }
      },
    )
    const existing = await this.database.run(
      async ({ usersRepository, registrationAttemptsRepository }) => {
        const user = await usersRepository.findByEmail(email)
        const attempt = await registrationAttemptsRepository.findActiveByEmail(email)
        return user || attempt
      },
    )
    if (existing) throw new OnboardingEmailUnavailableError()

    const confirmation = this.onboardingTokenProvider.issue()
    const cleanupClaimToken = this.onboardingIdentifierProvider.generate()
    let replacementSubject: string | undefined
    try {
      const result = await this.database.run(async (scope) => {
        const attempt =
          await scope.registrationAttemptsRepository.findPendingByTokenHash(tokenHash)
        if (!attempt || attempt.status !== RegistrationAttemptStatus.Pending)
          throw new NotFoundError('Onboarding not found')
        if (attempt.supersededProviderSubject)
          throw new ConflictError('Onboarding cleanup is pending')
        if (now.getTime() >= attempt.expiresAt.getTime())
          throw new OnboardingExpiredError()
        const oldUser = await scope.usersRepository.findById(attempt.userId)
        if (!oldUser) throw new NotFoundError('Onboarding not found')
        const replacement = await this.onboardingIdentityProvider.replacePendingIdentity({
          providerSubject: oldUser.id,
          email,
          password: request.password,
          name: oldUser.name,
          confirmationRedirectTo: confirmationRedirectUrl(
            request.confirmationRedirectBaseUrl,
            confirmation.token,
          ),
        })
        replacementSubject = replacement.authUser.id
        const newUser = await scope.usersRepository.add({
          id: replacement.authUser.id,
          establishmentId: oldUser.establishmentId,
          name: oldUser.name,
          email,
          profile: oldUser.profile,
          status: UserStatus.Pending,
          createdAt: oldUser.createdAt,
          updatedAt: now,
        })
        const updated: UserRegistrationAttempt =
          await scope.registrationAttemptsRepository.replace(attempt.id, {
            userId: newUser.id,
            email,
            confirmationTokenHash: confirmation.hash,
            supersededProviderSubject: oldUser.id,
            cleanupClaimToken,
            cleanupClaimedAt: now,
            updatedAt: now,
          })
        await scope.usersRepository.remove(oldUser.establishmentId, oldUser.id)
        const establishment = await scope.establishmentsRepository.findById(
          updated.establishmentId,
        )
        if (!establishment) throw new NotFoundError('Onboarding not found')
        await this.broker?.publish(replacement.event)
        return {
          establishmentName: establishment.name,
          managerName: updated.name,
          email: updated.email,
          expiresAt: updated.expiresAt,
        }
      })
      try {
        await this.onboardingIdentityProvider.removeIdentity(pending.attempt.userId)
        await this.database.run(async ({ registrationAttemptsRepository }) => {
          await registrationAttemptsRepository.clearSupersededProviderSubject({
            attemptId: pending.attempt.id,
            claimToken: cleanupClaimToken,
            supersededProviderSubject: pending.attempt.userId,
            updatedAt: now,
          })
        })
      } catch {
        // The superseded identity is intentionally retained as retryable cleanup metadata.
      }
      return result
    } catch (error) {
      if (replacementSubject) {
        await this.onboardingIdentityProvider.removeIdentity(replacementSubject)
      }
      throw error
    }
  }
}
