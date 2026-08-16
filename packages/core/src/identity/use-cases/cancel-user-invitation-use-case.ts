import type { Account } from '#identity/domain/entities/account.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { UserInvitationNotAllowedError } from '#identity/domain/errors/user-invitation-not-allowed-error.ts'
import { UserInvitationCancelledEvent } from '#identity/domain/events/user-invitation-cancelled-event.ts'
import { InvitationOperation } from '#identity/domain/structures/invitation-operation.ts'

type Request = { actor: Account; userId: string }

export class CancelUserInvitationUseCase implements UseCase<Request, void> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly identifierProvider: OnboardingIdentifierProvider,
    private readonly provider: UserAccessIdentityProvider,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<void> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Manager access required')
    const now = this.datetimeProvider.now()
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
        throw new UserInvitationNotAllowedError()
      return { user, attempt }
    })
    const operationToken = this.identifierProvider.generate()
    const claimed = await this.database.run(({ registrationAttemptsRepository }) =>
      registrationAttemptsRepository.claimInvitationOperation({
        attemptId: pending.attempt.id,
        expectedRevision: pending.attempt.revision,
        operation: InvitationOperation.Cancel,
        operationToken,
        claimedAt: now,
        staleBefore: new Date(now.getTime() - 15 * 60 * 1000),
      }),
    )
    if (!claimed) throw new ConflictError('Invitation is being changed')

    try {
      await this.provider.removeIdentity(pending.user.id)
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

    await this.database.run(async (scope) => {
      const attempt =
        await scope.registrationAttemptsRepository.finalizeInvitationOperation({
          attemptId: pending.attempt.id,
          operationToken,
          changes: {
            status: RegistrationAttemptStatus.Cancelled,
            updatedAt: now,
          },
        })
      if (!attempt) throw new ConflictError('Invitation operation was superseded')
      await scope.userAuditRecordsRepository?.add({
        id: `${pending.user.id}:${now.toISOString()}:cancelled`,
        establishmentId: pending.user.establishmentId,
        affectedUserId: pending.user.id,
        affectedUserName: pending.user.name,
        actorType: UserAuditActorType.User,
        actorUserId: request.actor.id,
        actorName: request.actor.name,
        action: UserAuditAction.InvitationCancelled,
        previousValue: UserStatus.Pending,
        newValue: 'cancelled',
        occurredAt: now,
      })
      // The registration attempt references the user with ON DELETE RESTRICT.
      // Remove the cancelled attempt before deleting the pending user record.
      await scope.registrationAttemptsRepository.remove(pending.attempt.id)
      await scope.usersRepository.remove(pending.user.establishmentId, pending.user.id)
    })
    await this.broker?.publish(
      new UserInvitationCancelledEvent({
        userId: pending.user.id,
        establishmentId: pending.user.establishmentId,
        actorUserId: request.actor.id,
        occurredAt: now,
      }),
    )
  }
}
