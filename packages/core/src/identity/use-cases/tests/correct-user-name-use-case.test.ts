import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { CorrectUserNameUseCase } from '#identity/use-cases/correct-user-name-use-case.ts'
import { UserNameChangeNotAllowedError } from '#identity/domain/errors/user-name-change-not-allowed-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { DatetimeProvider } from '#shared/interfaces/index.ts'

describe('Correct User Name Use Case', () => {
  it('rejects self-correction in this administrative workflow', async () => {
    const database = mock<IdentityDatabase>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const useCase = new CorrectUserNameUseCase(database, mock<DatetimeProvider>())
    await expect(
      useCase.execute({ actor, userId: actor.id, name: 'New name' }),
    ).rejects.toBeInstanceOf(UserNameChangeNotAllowedError)
    expect(database.run).not.toHaveBeenCalled()
  })
})
