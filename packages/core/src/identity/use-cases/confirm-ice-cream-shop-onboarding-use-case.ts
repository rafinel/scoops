import { OnboardingExpiredError } from '#identity/domain/errors/onboarding-expired-error.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { EstablishmentStatus } from '#identity/domain/structures/establishment-status.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

export class ConfirmIceCreamShopOnboardingUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingTokenProvider: OnboardingTokenProvider,
  ) {}

  async execute(request: {
    providerSubject: string
    verifiedEmail: string
    confirmationToken: string
  }): Promise<void> {
    const now = this.datetimeProvider.now()
    const confirmationHash = this.onboardingTokenProvider.hash(request.confirmationToken)
    const verifiedEmail = request.verifiedEmail.trim().toLowerCase()
    await this.database.run(async (scope) => {
      const user = await scope.usersRepository.findByProviderSubject(
        request.providerSubject,
      )
      if (!user) throw new NotFoundError('Onboarding not found')
      const attempt = await scope.registrationAttemptsRepository.findByUserId(user.id)
      if (
        !attempt ||
        attempt.confirmationTokenHash !== confirmationHash ||
        attempt.email !== verifiedEmail
      ) {
        throw new NotFoundError('Onboarding not found')
      }
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
  }
}
