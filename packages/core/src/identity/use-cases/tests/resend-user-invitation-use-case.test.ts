import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ResendUserInvitationUseCase } from '#identity/use-cases/resend-user-invitation-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type {
  OnboardingIdentifierProvider,
  OnboardingTokenProvider,
  UserAccessIdentityProvider,
} from '#identity/interfaces/index.ts'

describe('Resend User Invitation Use Case', () => {
  it('rejects non-manager actors before issuing a new token', async () => {
    const tokenProvider = mock<OnboardingTokenProvider>()
    const useCase = new ResendUserInvitationUseCase(
      mock<IdentityDatabase>(),
      mock<DatetimeProvider>(),
      tokenProvider,
      mock<OnboardingIdentifierProvider>(),
      mock<UserAccessIdentityProvider>(),
    )
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        userId: 'user-id',
        invitationRedirectBaseUrl: 'https://example.com/invitation',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(tokenProvider.issue).not.toHaveBeenCalled()
  })
})
