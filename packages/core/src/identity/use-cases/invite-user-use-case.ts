import type { Account } from '#identity/domain/entities/account.ts'
import type { UserDetails } from '#identity/domain/structures/user-details.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'
import { RegistrationAttemptStatus } from '#identity/domain/structures/registration-attempt-status.ts'
import { RegistrationAttemptType } from '#identity/domain/structures/registration-attempt-type.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { UserStatus } from '#identity/domain/structures/user-status.ts'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { OnboardingIdentifierProvider } from '#identity/interfaces/onboarding-identifier-provider.ts'
import type { OnboardingTokenProvider } from '#identity/interfaces/onboarding-token-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { UserInvitationEmailUnavailableError } from '#identity/domain/errors/user-invitation-email-unavailable-error.ts'
import { confirmationRedirectUrl } from '#identity/use-cases/confirmation-redirect.ts'

type Request = {
  actor: Account
  name: string
  email: string
  profile: UserProfile
  invitationRedirectBaseUrl: string
}
const INVITATION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export class InviteUserUseCase implements UseCase<Request, UserDetails> {
  constructor(
    private readonly database: IdentityDatabase,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly tokenProvider: OnboardingTokenProvider,
    private readonly identifierProvider: OnboardingIdentifierProvider,
    private readonly provider: UserAccessIdentityProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: Request): Promise<UserDetails> {
    if (request.actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Manager access required')
    const now = this.datetimeProvider.now()
    const name = request.name.trim()
    const email = request.email.trim().toLowerCase()
    const attemptToken = this.tokenProvider.issue()
    const attemptId = this.identifierProvider.generate()
    const existing = await this.database.run(
      async ({ usersRepository, registrationAttemptsRepository }) => ({
        user: await usersRepository.findByEmail(email),
        attempt: await registrationAttemptsRepository.findActiveByEmail(email),
      }),
    )
    if (existing.user || existing.attempt || !name)
      throw new UserInvitationEmailUnavailableError()
    let providerSubject: string | undefined
    const commitInvitation = async () =>
      this.database.run(async (scope) => {
        const duplicate = await scope.usersRepository.findByEmail(email)
        const duplicateAttempt =
          await scope.registrationAttemptsRepository.findActiveByEmail(email)
        if (duplicate || duplicateAttempt) throw new UserInvitationEmailUnavailableError()
        const identity = await this.provider.inviteIdentity({
          establishmentId: request.actor.establishmentId,
          email,
          name,
          invitationRedirectTo: confirmationRedirectUrl(
            request.invitationRedirectBaseUrl,
            attemptToken.token,
          ),
        })
        providerSubject = identity.authUser.id
        const user = await scope.usersRepository.add({
          id: identity.authUser.id,
          establishmentId: request.actor.establishmentId,
          name,
          email,
          profile: request.profile,
          status: UserStatus.Pending,
          createdAt: now,
          updatedAt: now,
        })
        const attempt = await scope.registrationAttemptsRepository.add({
          id: attemptId,
          userId: user.id,
          establishmentId: user.establishmentId,
          name,
          email,
          profile: user.profile,
          type: RegistrationAttemptType.UserInvitation,
          status: RegistrationAttemptStatus.Pending,
          tokenHash: attemptToken.hash,
          expiresAt: new Date(now.getTime() + INVITATION_DURATION_MS),
          createdAt: now,
          updatedAt: now,
          revision: 0,
        })
        await scope.userAuditRecordsRepository?.add({
          id: `${attempt.id}:registered`,
          establishmentId: user.establishmentId,
          affectedUserId: user.id,
          affectedUserName: user.name,
          actorType: UserAuditActorType.User,
          actorUserId: request.actor.id,
          actorName: request.actor.name,
          action: UserAuditAction.UserRegistered,
          newValue: user.profile,
          occurredAt: now,
        })
        await this.broker.publish(identity.event)
        return { user, attempt }
      })
    let result: Awaited<ReturnType<typeof commitInvitation>>
    try {
      result = await commitInvitation()
    } catch (error) {
      if (providerSubject) await this.provider.removeIdentity(providerSubject)
      throw error
    }
    const auditRecords = await this.database.run(
      async ({ userAuditRecordsRepository }) =>
        userAuditRecordsRepository
          ? await userAuditRecordsRepository.findManyByUser({
              establishmentId: result.user.establishmentId,
              affectedUserId: result.user.id,
            })
          : [],
    )
    return { user: result.user, auditRecords }
  }
}
