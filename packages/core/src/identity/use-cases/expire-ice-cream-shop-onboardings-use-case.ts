import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import type { UserRegistrationAttempt } from '#identity/domain/entities/user-registration-attempt.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'
import { InvitationOperation } from '#identity/domain/structures/invitation-operation.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

type Request = {
  limit: number
  claimToken: string
}

type CleanupCounts = {
  expired: number
  removed: number
  failed: number
}

export class ExpireIceCreamShopOnboardingsUseCase {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly onboardingIdentityProvider: OnboardingIdentityProvider,
    private readonly userAccessIdentityProvider?: UserAccessIdentityProvider,
  ) {}

  async execute(request: Request): Promise<CleanupCounts> {
    const now = this.datetimeProvider.now()
    const staleBefore = new Date(now.getTime() - 15 * 60 * 1000)
    const claims = await this.findCleanupClaims(request, now, staleBefore)
    const staleInvitationOperations = await this.findStaleInvitationOperations(
      request,
      staleBefore,
    )
    const counts = await this.reconcileStaleInvitationOperations(
      staleInvitationOperations,
      now,
    )
    const expiredInvitations = await this.findExpiredInvitations(request, now)
    this.addCounts(
      counts,
      await this.expireInvitations(expiredInvitations, request, now, staleBefore),
    )
    this.addCounts(counts, await this.processCleanupClaims(claims, request, now))
    return counts
  }

  private async findCleanupClaims(
    request: Request,
    now: Date,
    staleBefore: Date,
  ): Promise<UserRegistrationAttempt[]> {
    return (
      (await this.database.run(
        ({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
          registrationAttemptsRepository.claimForCleanup({
            cutoff: now,
            staleBefore,
            claimedAt: now,
            claimToken: request.claimToken,
            limit: request.limit,
          }),
      )) ?? []
    )
  }

  private async findStaleInvitationOperations(
    request: Request,
    staleBefore: Date,
  ): Promise<UserRegistrationAttempt[]> {
    return (
      (await this.database.run(
        ({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
          registrationAttemptsRepository.findStaleInvitationOperations({
            staleBefore,
            limit: request.limit,
          }),
      )) ?? []
    )
  }

  private async findExpiredInvitations(
    request: Request,
    now: Date,
  ): Promise<UserRegistrationAttempt[]> {
    return (
      (await this.database.run(
        ({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
          registrationAttemptsRepository.findPendingExpiredByType({
            type: RegistrationAttemptType.UserInvitation,
            cutoff: now,
            limit: request.limit,
          }),
      )) ?? []
    )
  }

  private async reconcileStaleInvitationOperations(
    operations: UserRegistrationAttempt[],
    now: Date,
  ): Promise<CleanupCounts> {
    const counts = this.createCounts()
    for (const operation of operations) {
      counts.failed += await this.reconcileStaleInvitationOperation(operation, now)
    }
    return counts
  }

  private async reconcileStaleInvitationOperation(
    operation: UserRegistrationAttempt,
    now: Date,
  ): Promise<number> {
    const pendingEmail = operation.pendingEmail
    const provider = this.userAccessIdentityProvider
    if (
      operation.operation === InvitationOperation.CorrectEmail &&
      pendingEmail &&
      provider
    ) {
      return this.reconcileCorrectedEmail(operation, pendingEmail, now, provider)
    }
    await this.tryClearInvitationOperation(operation, now)
    return 0
  }

  private async reconcileCorrectedEmail(
    operation: UserRegistrationAttempt,
    pendingEmail: string,
    now: Date,
    provider: UserAccessIdentityProvider,
  ): Promise<number> {
    try {
      const providerEmail = await provider.getIdentityEmail(operation.userId)
      if (providerEmail?.trim().toLowerCase() === pendingEmail.toLowerCase()) {
        await this.finalizeCorrectedEmail(operation, pendingEmail, now)
      } else {
        await this.clearInvitationOperation(operation, now)
      }
      return 0
    } catch {
      return 1
    }
  }

  private async finalizeCorrectedEmail(
    operation: UserRegistrationAttempt,
    pendingEmail: string,
    now: Date,
  ): Promise<void> {
    await this.database.run(
      async ({
        registrationAttemptsRepository,
        usersRepository,
      }: IdentityDatabaseRepositories) => {
        const finalized =
          await registrationAttemptsRepository.finalizeInvitationOperation({
            attemptId: operation.id,
            operationToken: operation.operationToken as string,
            changes: { email: pendingEmail, updatedAt: now },
          })
        if (!finalized) return
        await usersRepository.replace(operation.establishmentId, operation.userId, {
          email: pendingEmail,
          updatedAt: now,
        })
      },
    )
  }

  private async clearInvitationOperation(
    operation: UserRegistrationAttempt,
    now: Date,
  ): Promise<void> {
    await this.database.run(
      ({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
        registrationAttemptsRepository.clearInvitationOperation({
          attemptId: operation.id,
          operationToken: operation.operationToken as string,
          updatedAt: now,
        }),
    )
  }

  private async tryClearInvitationOperation(
    operation: UserRegistrationAttempt,
    now: Date,
  ): Promise<void> {
    await this.clearInvitationOperation(operation, now).catch(() => false)
  }

  private async expireInvitations(
    invitations: UserRegistrationAttempt[],
    request: Request,
    now: Date,
    staleBefore: Date,
  ): Promise<CleanupCounts> {
    const counts = this.createCounts()
    for (const invitation of invitations) {
      this.addCounts(
        counts,
        await this.expireInvitation(invitation, request, now, staleBefore),
      )
    }
    return counts
  }

  private async expireInvitation(
    invitation: UserRegistrationAttempt,
    request: Request,
    now: Date,
    staleBefore: Date,
  ): Promise<CleanupCounts> {
    const operationToken = `${request.claimToken}:${invitation.id}`
    const claimed = await this.database.run(
      ({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
        registrationAttemptsRepository.claimInvitationOperation({
          attemptId: invitation.id,
          expectedRevision: invitation.revision,
          operation: InvitationOperation.Expire,
          operationToken,
          claimedAt: now,
          staleBefore,
        }),
    )
    if (!claimed) return this.createCounts()

    try {
      if (!this.userAccessIdentityProvider) {
        throw new Error('O provedor de usuários está indisponível.')
      }
      await this.userAccessIdentityProvider.removeIdentity(invitation.userId)
      await this.finalizeExpiredInvitation(invitation, operationToken, now)
      return { expired: 1, removed: 1, failed: 0 }
    } catch {
      await this.tryClearInvitationOperationByToken(invitation.id, operationToken, now)
      return { expired: 1, removed: 0, failed: 1 }
    }
  }

  private async finalizeExpiredInvitation(
    invitation: UserRegistrationAttempt,
    operationToken: string,
    now: Date,
  ): Promise<void> {
    await this.database.run(
      async ({
        registrationAttemptsRepository,
        usersRepository,
      }: IdentityDatabaseRepositories) => {
        const finalized =
          await registrationAttemptsRepository.finalizeInvitationOperation({
            attemptId: invitation.id,
            operationToken,
            changes: {
              status: RegistrationAttemptStatus.Expired,
              updatedAt: now,
            },
          })
        if (!finalized) return
        await registrationAttemptsRepository.remove(invitation.id)
        await usersRepository.remove(invitation.establishmentId, invitation.userId)
      },
    )
  }

  private async tryClearInvitationOperationByToken(
    attemptId: string,
    operationToken: string,
    now: Date,
  ): Promise<void> {
    await this.database
      .run(({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
        registrationAttemptsRepository.clearInvitationOperation({
          attemptId,
          operationToken,
          updatedAt: now,
        }),
      )
      .catch(() => false)
  }

  private async processCleanupClaims(
    claims: UserRegistrationAttempt[],
    request: Request,
    now: Date,
  ): Promise<CleanupCounts> {
    const counts = this.createCounts()
    for (const claim of claims) {
      this.addCounts(counts, await this.processCleanupClaim(claim, request, now))
    }
    return counts
  }

  private async processCleanupClaim(
    claim: UserRegistrationAttempt,
    request: Request,
    now: Date,
  ): Promise<CleanupCounts> {
    if (claim.status !== RegistrationAttemptStatus.Expired) {
      return this.removeSupersededIdentity(claim, request, now)
    }
    return this.removeExpiredClaim(claim, request, now)
  }

  private async removeSupersededIdentity(
    claim: UserRegistrationAttempt,
    request: Request,
    now: Date,
  ): Promise<CleanupCounts> {
    if (!claim.supersededProviderSubject) return this.createCounts()
    try {
      await this.onboardingIdentityProvider.removeIdentity(
        claim.supersededProviderSubject,
      )
      await this.database.run(
        ({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
          registrationAttemptsRepository.clearSupersededProviderSubject({
            attemptId: claim.id,
            claimToken: request.claimToken,
            supersededProviderSubject: claim.supersededProviderSubject as string,
            updatedAt: now,
          }),
      )
      return { expired: 0, removed: 1, failed: 0 }
    } catch {
      return { expired: 0, removed: 0, failed: 1 }
    }
  }

  private async removeExpiredClaim(
    claim: UserRegistrationAttempt,
    request: Request,
    now: Date,
  ): Promise<CleanupCounts> {
    try {
      const identityProvider = this.getIdentityProvider(claim)
      await identityProvider.removeIdentity(claim.userId)
      await this.removeSupersededIdentityIfPresent(claim)
      await this.removeClaimedRecord(claim)
      return { expired: 1, removed: 1, failed: 0 }
    } catch {
      await this.tryClearCleanupClaim(claim, request, now)
      return { expired: 1, removed: 0, failed: 1 }
    }
  }

  private getIdentityProvider(
    claim: UserRegistrationAttempt,
  ): OnboardingIdentityProvider | UserAccessIdentityProvider {
    return claim.type === 'user-invitation' && this.userAccessIdentityProvider
      ? this.userAccessIdentityProvider
      : this.onboardingIdentityProvider
  }

  private async removeSupersededIdentityIfPresent(
    claim: UserRegistrationAttempt,
  ): Promise<void> {
    if (!claim.supersededProviderSubject) return
    await this.onboardingIdentityProvider.removeIdentity(claim.supersededProviderSubject)
  }

  private async removeClaimedRecord(claim: UserRegistrationAttempt): Promise<void> {
    await this.database.run(
      async ({
        establishmentsRepository,
        registrationAttemptsRepository,
        usersRepository,
      }: IdentityDatabaseRepositories) => {
        if (claim.type === 'user-invitation') {
          await usersRepository.remove(claim.establishmentId, claim.userId)
          await registrationAttemptsRepository.remove(claim.id)
        } else {
          await establishmentsRepository.remove(claim.establishmentId)
        }
      },
    )
  }

  private async tryClearCleanupClaim(
    claim: UserRegistrationAttempt,
    request: Request,
    now: Date,
  ): Promise<void> {
    await this.database
      .run(({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
        registrationAttemptsRepository.clearCleanupClaim({
          attemptId: claim.id,
          claimToken: request.claimToken,
          updatedAt: now,
        }),
      )
      .catch(() => false)
  }

  private createCounts(): CleanupCounts {
    return { expired: 0, removed: 0, failed: 0 }
  }

  private addCounts(target: CleanupCounts, source: CleanupCounts): void {
    target.expired += source.expired
    target.removed += source.removed
    target.failed += source.failed
  }
}
