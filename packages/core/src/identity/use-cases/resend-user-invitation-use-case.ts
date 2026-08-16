import type { Account } from '#identity/domain/entities/account.ts'
import type { UserDetails } from '#identity/domain/structures/user-details.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { UserInvitationExpiredError } from '#identity/domain/errors/user-invitation-expired-error.ts'
import { UserInvitationResentEvent } from '#identity/domain/events/user-invitation-resent-event.ts'
import { InvitationOperation } from '#identity/domain/structures/invitation-operation.ts'
import { confirmationRedirectUrl } from '#identity/use-cases/confirmation-redirect.ts'

type Request = { actor: Account; userId: string; invitationRedirectBaseUrl: string }
const DURATION = 7 * 24 * 60 * 60 * 1000

export class ResendUserInvitationUseCase implements UseCase<Request, UserDetails> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly tokenProvider: OnboardingTokenProvider,
    private readonly identifierProvider: OnboardingIdentifierProvider,
    private readonly provider: UserAccessIdentityProvider,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<UserDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Manager access required')
    const now = this.datetimeProvider.now()
    const next = this.tokenProvider.issue()
    const operationToken = this.identifierProvider.generate()
    const pending = await this.database.run(async (scope) => {
      const user = await scope.usersRepository.findByIdInEstablishment(
        request.actor.establishmentId,
        request.userId,
      )
      const attempt = user
        ? await scope.registrationAttemptsRepository.findByUserId(user.id)
        : undefined
      if (
        !user ||
        !attempt ||
        user.status !== UserStatus.Pending ||
        attempt.status !== RegistrationAttemptStatus.Pending
      )
        throw new NotFoundError('Invitation not found')
      if (now.getTime() >= attempt.expiresAt.getTime())
        throw new UserInvitationExpiredError()
      return { user, attempt }
    })
    const expiresAt = new Date(now.getTime() + DURATION)
    const claimed = await this.database.run(({ registrationAttemptsRepository }) =>
      registrationAttemptsRepository.claimInvitationOperation({
        attemptId: pending.attempt.id,
        expectedRevision: pending.attempt.revision,
        operation: InvitationOperation.Resend,
        operationToken,
        claimedAt: now,
        staleBefore: new Date(now.getTime() - 15 * 60 * 1000),
        pendingTokenHash: next.hash,
        pendingExpiresAt: expiresAt,
      }),
    )
    if (!claimed) throw new ConflictError('Invitation is being changed')

    try {
      await this.provider.resendInvitation({
        email: pending.user.email,
        invitationRedirectTo: confirmationRedirectUrl(
          request.invitationRedirectBaseUrl,
          next.token,
        ),
      })
    } catch (error) {
      await this.database
        .run(({ registrationAttemptsRepository }) =>
          registrationAttemptsRepository.clearInvitationOperation({
            attemptId: pending.attempt.id,
            operationToken,
            updatedAt: now,
          }),
        )
        .catch(() => false)
      throw error
    }

    const result = await this.database.run(async (scope) => {
      const attempt =
        await scope.registrationAttemptsRepository.finalizeInvitationOperation({
          attemptId: pending.attempt.id,
          operationToken,
          changes: {
            tokenHash: claimed.pendingTokenHash,
            expiresAt: claimed.pendingExpiresAt,
            updatedAt: now,
          },
        })
      if (!attempt) throw new ConflictError('Invitation operation was superseded')
      const user = await scope.usersRepository.replace(
        pending.user.establishmentId,
        pending.user.id,
        { updatedAt: now },
      )
      await scope.userAuditRecordsRepository?.add({
        id: `${attempt.id}:${attempt.revision}:resent`,
        establishmentId: pending.user.establishmentId,
        affectedUserId: pending.user.id,
        affectedUserName: pending.user.name,
        actorType: UserAuditActorType.User,
        actorUserId: request.actor.id,
        actorName: request.actor.name,
        action: UserAuditAction.InvitationResent,
        previousValue: pending.attempt.expiresAt.toISOString(),
        newValue: expiresAt.toISOString(),
        occurredAt: now,
      })
      return user
    })
    await this.broker?.publish(
      new UserInvitationResentEvent({
        userId: result.id,
        establishmentId: result.establishmentId,
        email: result.email,
        actorUserId: request.actor.id,
        occurredAt: now,
      }),
    )
    const auditRecords = await this.database.run(
      async ({ userAuditRecordsRepository }) =>
        userAuditRecordsRepository
          ? await userAuditRecordsRepository.findManyByUser({
              establishmentId: result.establishmentId,
              affectedUserId: result.id,
            })
          : [],
    )
    return { user: result, auditRecords }
  }
}
