import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { AccompanimentTypeFaker } from '#mrp/domain/entities/fakers/index.ts'
import type { AccompanimentTypePage } from '#mrp/domain/structures/accompaniment-type-page.ts'
import type { AccompanimentTypesRepository } from '#mrp/interfaces/accompaniment-types-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import { ListAccompanimentTypesUseCase } from '#mrp/use-cases/list-accompaniment-types-use-case.ts'

const page = (overrides: Partial<AccompanimentTypePage> = {}): AccompanimentTypePage => ({
  items: [{ type: AccompanimentTypeFaker.fake({ id: 'type-1' }), usageCount: 0 }],
  page: 1,
  pageSize: 10,
  total: 1,
  totalPages: 1,
  ...overrides,
})

describe('List Accompaniment Types Use Case', () => {
  let repository: MockProxy<AccompanimentTypesRepository>
  let useCase: ListAccompanimentTypesUseCase

  beforeEach(() => {
    repository = mock<AccompanimentTypesRepository>()
    repository.findPage.mockResolvedValue(page())
    useCase = new ListAccompanimentTypesUseCase(repository)
  })

  it('forwards tenant, trimmed search and defaults, normalizing an out-of-range page', async () => {
    repository.findPage
      .mockResolvedValueOnce(page({ page: 9, totalPages: 2 }))
      .mockResolvedValueOnce(page({ page: 2 }))
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        search: '  sauce  ',
        page: 9,
      }),
    ).resolves.toMatchObject({ page: 2 })
    expect(repository.findPage).toHaveBeenNthCalledWith(1, {
      establishmentId: 'establishment-1',
      search: 'sauce',
      page: 9,
      pageSize: 10,
    })
    expect(repository.findPage).toHaveBeenNthCalledWith(2, {
      establishmentId: 'establishment-1',
      search: 'sauce',
      page: 2,
      pageSize: 10,
    })
  })

  it('rejects operators and invalid page values before querying', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId: 'e1', profile: UserProfile.Operator },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        page: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        pageSize: 101,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(repository.findPage).not.toHaveBeenCalled()
  })
})
