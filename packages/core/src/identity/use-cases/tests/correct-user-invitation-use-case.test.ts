import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { CorrectUserInvitationUseCase } from '#identity/use-cases/correct-user-invitation-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'
import type {
  OnboardingIdentifierProvider,
  UserAccessIdentityProvider,
} from '#identity/interfaces/index.ts'

describe('Correct User Invitation Use Case', () => {
  it('rejects non-manager actors before reading an invitation', async () => {
    const database = mock<IdentityDatabase>()
    const useCase = new CorrectUserInvitationUseCase(
      database,
      mock<DatetimeProvider>(),
      mock<OnboardingIdentifierProvider>(),
      mock<UserAccessIdentityProvider>(),
    )
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        userId: 'user-id',
        name: 'Name',
        email: 'a@example.com',
        profile: UserProfile.Operator,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(database.run).not.toHaveBeenCalled()
  })
})
