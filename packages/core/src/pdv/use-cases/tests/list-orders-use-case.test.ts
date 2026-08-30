import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { OrderFaker } from '#pdv/domain/entities/fakers/order-faker.ts'
import type { OrderListParams } from '#pdv/domain/structures/order-list-params.ts'
import { OrderStatus } from '#pdv/domain/structures/order-status.ts'
import type { OrdersRepository } from '#pdv/interfaces/orders-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import { ListOrdersUseCase } from '#pdv/use-cases/list-orders-use-case.ts'

const actor = {
  id: 'operator-1',
  name: 'Operator',
  establishmentId: 'establishment-1',
  profile: UserProfile.Operator,
} as const

describe('List Order Use Case', () => {
  let repository: MockProxy<OrdersRepository>
  let useCase: ListOrdersUseCase

  beforeEach(() => {
    repository = mock<OrdersRepository>()
    repository.findMany.mockResolvedValue(new PaginationResponse([], 1, 6, 0, 0))
    useCase = new ListOrdersUseCase(repository)
  })

  it('forwards normalized filters and the actor tenant', async () => {
    const params = {
      search: '  #42  ',
      createdFrom: new Date('2026-01-01T00:00:00.000Z'),
      createdTo: new Date('2026-01-30T23:59:59.999Z'),
      channelId: null,
      status: OrderStatus.Canceled,
      page: 2,
      pageSize: 6,
    } satisfies Omit<OrderListParams, 'establishmentId'>

    await useCase.execute({ actor, ...params })

    expect(repository.findMany).toHaveBeenCalledWith({
      ...params,
      search: '#42',
      establishmentId: actor.establishmentId,
    })
  })

  it.each([
    { page: 0, pageSize: 6 },
    { page: 1.5, pageSize: 6 },
    { page: 1, pageSize: 101 },
  ])('rejects an unbounded page request: %s', async (input) => {
    await expect(useCase.execute({ actor, ...input })).rejects.toBeInstanceOf(
      BadRequestError,
    )
    expect(repository.findMany).not.toHaveBeenCalled()
  })

  it('allows both authorized profiles and rejects other profiles', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Manager },
        page: 1,
        pageSize: 6,
      }),
    ).resolves.toBeInstanceOf(PaginationResponse)
    await expect(
      useCase.execute({
        actor: { ...actor, profile: 'owner' as UserProfile },
        page: 1,
        pageSize: 6,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('returns repository pagination without mutating the order snapshots', async () => {
    const result = new PaginationResponse([OrderFaker.fake()], 1, 6, 1, 1)
    repository.findMany.mockResolvedValue(result)
    await expect(useCase.execute({ actor, page: 1, pageSize: 6 })).resolves.toBe(result)
  })
})
