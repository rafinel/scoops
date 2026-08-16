import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { GetUserDetailsUseCase } from '#identity/use-cases/get-user-details-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'

describe('Get User Details Use Case', () => {
  it('rejects non-manager actors before reading a target', async () => {
    const database = mock<IdentityDatabase>()
    const useCase = new GetUserDetailsUseCase(database)
    await expect(
      useCase.execute({
        actor: AccountFaker.fake({ profile: UserProfile.Operator }),
        userId: 'user-id',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(database.run).not.toHaveBeenCalled()
  })

  it('hides the Manager own details before reading the database', async () => {
    const database = mock<IdentityDatabase>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const useCase = new GetUserDetailsUseCase(database)

    await expect(useCase.execute({ actor, userId: actor.id })).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(database.run).not.toHaveBeenCalled()
  })
})
