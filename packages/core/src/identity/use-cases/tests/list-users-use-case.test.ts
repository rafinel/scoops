import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ListUsersUseCase } from '#identity/use-cases/list-users-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'

describe('List Users Use Case', () => {
  it('rejects non-manager actors before opening the database', async () => {
    const database = mock<IdentityDatabase>()
    const useCase = new ListUsersUseCase(database)
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(database.run).not.toHaveBeenCalled()
  })
})
