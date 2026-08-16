import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'
import { InvitationOperation } from '#identity/domain/structures/invitation-operation.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

export class ExpireIceCreamShopOnboardingsUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingIdentityProvider: OnboardingIdentityProvider,
    private readonly userAccessIdentityProvider?: UserAccessIdentityProvider,
  ) {}

  async execute(request: {
    limit: number
    claimToken: string
  }): Promise<{ expired: number; removed: number; failed: number }> {
    const now = this.datetimeProvider.now()
    const staleBefore = new Date(now.getTime() - 15 * 60 * 1000)
    const claims =
      (await this.database.run(({ registrationAttemptsRepository }) =>
        registrationAttemptsRepository.claimForCleanup({
          cutoff: now,
          staleBefore,
          claimedAt: now,
          claimToken: request.claimToken,
          limit: request.limit,
        }),
      )) ?? []
    const staleInvitationOperations =
      (await this.database.run(({ registrationAttemptsRepository }) =>
        registrationAttemptsRepository.findStaleInvitationOperations({
          staleBefore,
          limit: request.limit,
        }),
      )) ?? []
    let expired = 0
    let removed = 0
    let failed = 0

    for (const operation of staleInvitationOperations) {
      if (
        operation.operation === InvitationOperation.CorrectEmail &&
        operation.pendingEmail &&
        this.userAccessIdentityProvider
      ) {
        try {
          const providerEmail = await this.userAccessIdentityProvider.getIdentityEmail(
            operation.userId,
          )
          if (
            providerEmail?.trim().toLowerCase() === operation.pendingEmail.toLowerCase()
          ) {
            await this.database.run(async (scope) => {
              const finalized =
                await scope.registrationAttemptsRepository.finalizeInvitationOperation({
                  attemptId: operation.id,
                  operationToken: operation.operationToken as string,
                  changes: { email: operation.pendingEmail, updatedAt: now },
                })
              if (!finalized) return
              await scope.usersRepository.replace(
                operation.establishmentId,
                operation.userId,
                {
                  email: operation.pendingEmail,
                  updatedAt: now,
                },
              )
            })
          } else {
            await this.database.run(({ registrationAttemptsRepository }) =>
              registrationAttemptsRepository.clearInvitationOperation({
                attemptId: operation.id,
                operationToken: operation.operationToken as string,
                updatedAt: now,
              }),
            )
          }
        } catch {
          failed++
        }
      } else {
        await this.database
          .run(({ registrationAttemptsRepository }) =>
            registrationAttemptsRepository.clearInvitationOperation({
              attemptId: operation.id,
              operationToken: operation.operationToken as string,
              updatedAt: now,
            }),
          )
          .catch(() => false)
      }
    }

    const expiredInvitations =
      (await this.database.run(({ registrationAttemptsRepository }) =>
        registrationAttemptsRepository.findPendingExpiredByType({
          type: RegistrationAttemptType.UserInvitation,
          cutoff: now,
          limit: request.limit,
        }),
      )) ?? []
    for (const invitation of expiredInvitations) {
      const operationToken = `${request.claimToken}:${invitation.id}`
      const claimed = await this.database.run(({ registrationAttemptsRepository }) =>
        registrationAttemptsRepository.claimInvitationOperation({
          attemptId: invitation.id,
          expectedRevision: invitation.revision,
          operation: InvitationOperation.Expire,
          operationToken,
          claimedAt: now,
          staleBefore,
        }),
      )
      if (!claimed) continue
      expired++
      try {
        if (!this.userAccessIdentityProvider) throw new Error('User provider unavailable')
        await this.userAccessIdentityProvider.removeIdentity(invitation.userId)
        await this.database.run(async (scope) => {
          const finalized =
            await scope.registrationAttemptsRepository.finalizeInvitationOperation({
              attemptId: invitation.id,
              operationToken,
              changes: {
                status: RegistrationAttemptStatus.Expired,
                updatedAt: now,
              },
            })
          if (!finalized) return
          await scope.registrationAttemptsRepository.remove(invitation.id)
          await scope.usersRepository.remove(
            invitation.establishmentId,
            invitation.userId,
          )
        })
        removed++
      } catch {
        failed++
        await this.database
          .run(({ registrationAttemptsRepository }) =>
            registrationAttemptsRepository.clearInvitationOperation({
              attemptId: invitation.id,
              operationToken,
              updatedAt: now,
            }),
          )
          .catch(() => false)
      }
    }

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
        const identityProvider =
          claim.type === 'user-invitation' && this.userAccessIdentityProvider
            ? this.userAccessIdentityProvider
            : this.onboardingIdentityProvider
        await identityProvider.removeIdentity(claim.userId)
        if (claim.supersededProviderSubject) {
          await this.onboardingIdentityProvider.removeIdentity(
            claim.supersededProviderSubject,
          )
        }
        await this.database.run(async (scope) => {
          if (claim.type === 'user-invitation') {
            await scope.usersRepository.remove(claim.establishmentId, claim.userId)
            await scope.registrationAttemptsRepository.remove(claim.id)
          } else {
            await scope.establishmentsRepository.remove(claim.establishmentId)
          }
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
