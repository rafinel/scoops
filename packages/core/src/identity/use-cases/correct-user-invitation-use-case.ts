import type { Account } from '#identity/domain/entities/account.ts'
import type { UserDetails } from '#identity/domain/structures/user-details.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { UserInvitationNotAllowedError } from '#identity/domain/errors/user-invitation-not-allowed-error.ts'
import { InvitationOperation } from '#identity/domain/structures/invitation-operation.ts'

type Request = {
  actor: Account
  userId: string
  name: string
  email: string
  profile: UserProfile
}

export class CorrectUserInvitationUseCase implements UseCase<Request, UserDetails> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly identifierProvider: OnboardingIdentifierProvider,
    private readonly provider: UserAccessIdentityProvider,
  ) {}

  async execute(request: Request): Promise<UserDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Manager access required')
    const now = this.datetimeProvider.now()
    const name = request.name.trim()
    const email = request.email.trim().toLowerCase()
    const result = await this.database.run(async (scope) => {
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
        attempt.status !== RegistrationAttemptStatus.Pending ||
        now >= attempt.expiresAt ||
        !name
      )
        throw new NotFoundError('Invitation not found')
      if (
        email !== user.email &&
        ((await scope.usersRepository.findByEmail(email)) ||
          (await scope.registrationAttemptsRepository.findActiveByEmail(email)))
      )
        throw new UserInvitationNotAllowedError()
      return { user, attempt }
    })
    const operationToken = this.identifierProvider.generate()
    const claimed = await this.database.run(({ registrationAttemptsRepository }) =>
      registrationAttemptsRepository.claimInvitationOperation({
        attemptId: result.attempt.id,
        expectedRevision: result.attempt.revision,
        operation: InvitationOperation.CorrectEmail,
        operationToken,
        claimedAt: now,
        staleBefore: new Date(now.getTime() - 15 * 60 * 1000),
        pendingEmail: email,
      }),
    )
    if (!claimed) throw new ConflictError('Invitation is being changed')

    if (email !== result.user.email) {
      try {
        await this.provider.correctPendingIdentityEmail({
          providerSubject: result.user.id,
          email,
        })
      } catch (error) {
        await this.database
          .run(({ registrationAttemptsRepository }) =>
            registrationAttemptsRepository.clearInvitationOperation({
              attemptId: result.attempt.id,
              operationToken,
              updatedAt: now,
            }),
          )
          .catch(() => false)
        throw error
      }
    }

    const updated = await this.database.run(async (scope) => {
      const attempt =
        await scope.registrationAttemptsRepository.finalizeInvitationOperation({
          attemptId: result.attempt.id,
          operationToken,
          changes: {
            email,
            updatedAt: now,
          },
        })
      if (!attempt) throw new ConflictError('Invitation operation was superseded')
      const user = await scope.usersRepository.replace(
        request.actor.establishmentId,
        request.userId,
        { name, email, profile: request.profile, updatedAt: now },
      )
      await scope.registrationAttemptsRepository.replace(result.attempt.id, {
        name,
        email,
        profile: request.profile,
        updatedAt: now,
        revision: (result.attempt.revision ?? 0) + 1,
      })
      return user
    })
    const auditRecords = await this.database.run(
      async ({ userAuditRecordsRepository }) =>
        userAuditRecordsRepository
          ? await userAuditRecordsRepository.findManyByUser({
              establishmentId: updated.establishmentId,
              affectedUserId: updated.id,
            })
          : [],
    )
    return { user: updated, auditRecords }
  }
}
