import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { CancelUserInvitationUseCase } from '#identity/use-cases/cancel-user-invitation-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type {
  OnboardingIdentifierProvider,
  UserAccessIdentityProvider,
} from '#identity/interfaces/index.ts'

describe('Cancel User Invitation Use Case', () => {
  it('rejects non-manager actors before provider deletion', async () => {
    const provider = mock<UserAccessIdentityProvider>()
    const useCase = new CancelUserInvitationUseCase(
      mock<IdentityDatabase>(),
      mock<DatetimeProvider>(),
      mock<OnboardingIdentifierProvider>(),
      provider,
    )
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        userId: 'user-id',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(provider.removeIdentity).not.toHaveBeenCalled()
  })
})
