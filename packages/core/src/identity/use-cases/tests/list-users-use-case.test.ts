import { describe, expect, it } from 'vitest'
import { AccountFaker, UserFaker } from '#identity/domain/entities/fakers/index.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ListUsersUseCase } from '#identity/use-cases/list-users-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { mock } from 'vitest-mock-extended'
import type { IdentityDatabase } from '#identity/interfaces/identity-database.ts'
import type { UsersRepository } from '#identity/interfaces/users-repository.ts'
import { UsersPage } from '#identity/domain/structures/users-page.ts'

describe('List Users Use Case', () => {
  it('returns filtered rows with the repository global summary', async () => {
    const database = mock<IdentityDatabase>()
    const usersRepository = mock<UsersRepository>()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const operator = UserFaker.fake({
      establishmentId: actor.establishmentId,
      profile: UserProfile.Operator,
    })
    usersRepository.findMany.mockResolvedValue(
      new UsersPage([operator], 1, 20, 1, 1, {
        total: 4,
        managers: 1,
        operators: 3,
      }),
    )
    database.run.mockImplementation((operation) =>
      operation({ usersRepository } as never),
    )
    const useCase = new ListUsersUseCase(database)

    const result = await useCase.execute({
      actor,
      profile: UserProfile.Operator,
      search: '  operator  ',
      page: 1,
      pageSize: 20,
    })

    expect(usersRepository.findMany).toHaveBeenCalledWith({
      establishmentId: actor.establishmentId,
      excludeUserId: actor.id,
      profile: UserProfile.Operator,
      search: 'operator',
      status: undefined,
      page: 1,
      pageSize: 20,
    })
    expect(result).toMatchObject({
      items: [expect.objectContaining({ id: operator.id })],
      total: 1,
      summary: { total: 4, managers: 1, operators: 3 },
    })
  })

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
