import type { Establishment } from '#identity/domain/entities/establishment.ts'
import type { UserRegistrationAttempt } from '#identity/domain/entities/user-registration-attempt.ts'
import type { User } from '#identity/domain/entities/user.ts'
import { OnboardingEmailUnavailableError } from '#identity/domain/errors/onboarding-email-unavailable-error.ts'
import { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'
import type { IceCreamShopOnboardingInput } from '#identity/domain/structures/ice-cream-shop-onboarding-input.ts'
import type { IceCreamShopOnboardingRegistration } from '#identity/domain/structures/ice-cream-shop-onboarding-registration.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { confirmationRedirectUrl } from '#identity/use-cases/confirmation-redirect.ts'

type Request = IceCreamShopOnboardingInput & { confirmationRedirectBaseUrl: string }

const ONBOARDING_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export class RegisterIceCreamShopUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingTokenProvider: OnboardingTokenProvider,
    private readonly onboardingIdentifierProvider: OnboardingIdentifierProvider,
    private readonly onboardingIdentityProvider: OnboardingIdentityProvider,
  ) {}

  async execute(request: Request): Promise<IceCreamShopOnboardingRegistration> {
    const now = this.datetimeProvider.now()
    const establishmentName = request.establishmentName.trim()
    const managerName = request.managerName.trim()
    const email = request.email.trim().toLowerCase()
    const expiresAt = new Date(now.getTime() + ONBOARDING_DURATION_MS)
    const continuation = this.onboardingTokenProvider.issue()
    const confirmation = this.onboardingTokenProvider.issue()
    const establishmentId = this.onboardingIdentifierProvider.generate()
    const attemptId = this.onboardingIdentifierProvider.generate()

    await this.database.run(
      async ({ registrationAttemptsRepository, usersRepository }) => {
        const existingUser = await usersRepository.findByEmail(email)
        const existingAttempt =
          await registrationAttemptsRepository.findActiveByEmail(email)
        if (existingUser || existingAttempt) throw new OnboardingEmailUnavailableError()
      },
    )

    const providerIdentity =
      await this.onboardingIdentityProvider.registerPendingIdentity({
        email,
        password: request.password,
        confirmationRedirectTo: confirmationRedirectUrl(
          request.confirmationRedirectBaseUrl,
          confirmation.token,
        ),
      })
    if (!providerIdentity) throw new OnboardingEmailUnavailableError()

    try {
      const onboarding = await this.database.run(async (scope) => {
        const existingUser = await scope.usersRepository.findByEmail(email)
        const existingAttempt =
          await scope.registrationAttemptsRepository.findActiveByEmail(email)
        if (existingUser || existingAttempt) throw new OnboardingEmailUnavailableError()

        const establishment: Establishment = await scope.establishmentsRepository.add({
          id: establishmentId,
          name: establishmentName,
          status: EstablishmentStatus.Pending,
          createdAt: now,
          updatedAt: now,
        })
        const user: User = await scope.usersRepository.add({
          id: providerIdentity.providerSubject,
          establishmentId,
          name: managerName,
          email,
          profile: UserProfile.Manager,
          status: UserStatus.Pending,
          createdAt: now,
          updatedAt: now,
        })
        const attempt: UserRegistrationAttempt =
          await scope.registrationAttemptsRepository.add({
            id: attemptId,
            userId: user.id,
            establishmentId: establishment.id,
            name: managerName,
            email,
            profile: UserProfile.Manager,
            type: RegistrationAttemptType.EstablishmentOnboarding,
            status: RegistrationAttemptStatus.Pending,
            tokenHash: continuation.hash,
            confirmationTokenHash: confirmation.hash,
            expiresAt,
            createdAt: now,
            updatedAt: now,
            revision: 0,
          })
        return {
          continuationToken: continuation.token,
          onboarding: {
            establishmentName: establishment.name,
            managerName: user.name,
            email: user.email,
            expiresAt: attempt.expiresAt,
          },
        }
      })
      return onboarding
    } catch (error) {
      await this.onboardingIdentityProvider.removeIdentity(
        providerIdentity.providerSubject,
      )
      throw error
    }
  }
}
