import type { IdentityDatabaseRepositories } from '#identity/interfaces/identity-database.ts'
import type { Account } from '#identity/domain/entities/account.ts'
import type { User } from '#identity/domain/entities/user.ts'
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
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { UserInvitationExpiredError } from '#identity/domain/errors/user-invitation-expired-error.ts'
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
  ) {}

  async execute(request: Request): Promise<UserDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('É necessário ter acesso de gerente.')
    const now = this.datetimeProvider.now()
    const next = this.tokenProvider.issue()
    const operationToken = this.identifierProvider.generate()
    const pending = await this.database.run(
      async ({
        registrationAttemptsRepository,
        usersRepository,
      }: IdentityDatabaseRepositories) => {
        const user = await usersRepository.findByIdInEstablishment(
          request.actor.establishmentId,
          request.userId,
        )
        const attempt = user
          ? await registrationAttemptsRepository.findByUserId(user.id)
          : undefined
        if (
          !user ||
          !attempt ||
          user.status !== UserStatus.Pending ||
          attempt.status !== RegistrationAttemptStatus.Pending
        )
          throw new NotFoundError('Convite não encontrado.')
        if (now.getTime() >= attempt.expiresAt.getTime())
          throw new UserInvitationExpiredError()
        return { user, attempt }
      },
    )
    const expiresAt = new Date(now.getTime() + DURATION)
    const claimed = await this.database.run(
      ({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
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
    if (!claimed) throw new ConflictError('O convite está sendo alterado.')

    let result: User
    try {
      result = await this.database.run(
        async ({
          registrationAttemptsRepository,
          usersRepository,
          userAuditRecordsRepository,
          eventsRepository,
        }: IdentityDatabaseRepositories) => {
          const event = await this.provider.prepareInvitationResend({
            providerSubject: pending.user.id,
            establishmentId: pending.user.establishmentId,
            invitationRedirectTo: confirmationRedirectUrl(
              request.invitationRedirectBaseUrl,
              next.token,
            ),
          })
          const attempt =
            await registrationAttemptsRepository.finalizeInvitationOperation({
              attemptId: pending.attempt.id,
              operationToken,
              changes: {
                tokenHash: claimed.pendingTokenHash,
                expiresAt: claimed.pendingExpiresAt,
                updatedAt: now,
              },
            })
          if (!attempt) throw new ConflictError('A operação do convite foi substituída.')
          const user = await usersRepository.replace(
            pending.user.establishmentId,
            pending.user.id,
            { updatedAt: now },
          )
          await userAuditRecordsRepository?.add({
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
          await eventsRepository.add(event)
          return user
        },
      )
    } catch (error) {
      await this.database
        .run(({ registrationAttemptsRepository }: IdentityDatabaseRepositories) =>
          registrationAttemptsRepository.clearInvitationOperation({
            attemptId: pending.attempt.id,
            operationToken,
            updatedAt: now,
          }),
        )
        .catch(() => false)
      throw error
    }
    const auditRecords = await this.database.run(
      async ({ userAuditRecordsRepository }: IdentityDatabaseRepositories) =>
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
