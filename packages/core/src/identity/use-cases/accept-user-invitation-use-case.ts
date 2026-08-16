import type { AuthUser } from '#identity/domain/structures/auth-user.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import { UserInvitationExpiredError } from '#identity/domain/errors/user-invitation-expired-error.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import { UserInvitationAcceptedEvent } from '#identity/domain/events/user-invitation-accepted-event.ts'
import { InvitationOperation } from '#identity/domain/structures/invitation-operation.ts'

type Request = { authUser: AuthUser; confirmationToken: string }

export class AcceptUserInvitationUseCase implements UseCase<Request, void> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly tokenProvider: OnboardingTokenProvider,
    private readonly identifierProvider: OnboardingIdentifierProvider,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<void> {
    const now = this.datetimeProvider.now()
    const hash = this.tokenProvider.hash(request.confirmationToken)
    const result = await this.database.run(async (scope) => {
      const attempt =
        await scope.registrationAttemptsRepository.findPendingByTokenHash(hash)
      if (attempt?.type !== 'user-invitation')
        throw new NotFoundError('Invitation not found')
      const user = await scope.usersRepository.findById(attempt.userId)
      if (!user) throw new NotFoundError('Invitation not found')

      const authEmail = request.authUser.email.trim().toLowerCase()
      if (
        attempt.status === RegistrationAttemptStatus.Confirmed &&
        user.status === UserStatus.Active &&
        user.id === request.authUser.id &&
        user.email === authEmail
      ) {
        return { user, activated: false }
      }

      if (now.getTime() >= attempt.expiresAt.getTime())
        throw new UserInvitationExpiredError()
      if (
        attempt.status !== RegistrationAttemptStatus.Pending ||
        attempt.userId !== request.authUser.id ||
        attempt.email !== authEmail ||
        user.status !== UserStatus.Pending
      )
        throw new NotFoundError('Invitation not found')
      const operationToken = this.identifierProvider.generate()
      const claimed = await scope.registrationAttemptsRepository.claimInvitationOperation(
        {
          attemptId: attempt.id,
          expectedRevision: attempt.revision,
          operation: InvitationOperation.Accept,
          operationToken,
          claimedAt: now,
          staleBefore: new Date(now.getTime() - 15 * 60 * 1000),
        },
      )
      if (!claimed) throw new ConflictError('Invitation is being changed')
      const updated = await scope.usersRepository.replace(user.establishmentId, user.id, {
        status: UserStatus.Active,
        updatedAt: now,
      })
      const finalized =
        await scope.registrationAttemptsRepository.finalizeInvitationOperation({
          attemptId: attempt.id,
          operationToken,
          changes: {
            status: RegistrationAttemptStatus.Confirmed,
            updatedAt: now,
          },
        })
      if (!finalized) throw new ConflictError('Invitation operation was superseded')
      await scope.userAuditRecordsRepository?.add({
        id: `${user.id}:${now.toISOString()}:activated`,
        establishmentId: user.establishmentId,
        affectedUserId: user.id,
        affectedUserName: user.name,
        actorType: UserAuditActorType.User,
        actorUserId: user.id,
        actorName: user.name,
        action: UserAuditAction.UserActivated,
        previousValue: UserStatus.Pending,
        newValue: UserStatus.Active,
        occurredAt: now,
      })
      return { user: updated, activated: true }
    })
    if (!result.activated) return
    await this.broker?.publish(
      new UserInvitationAcceptedEvent({
        userId: result.user.id,
        establishmentId: result.user.establishmentId,
        email: result.user.email,
        profile: result.user.profile,
        occurredAt: now,
      }),
    )
  }
}
