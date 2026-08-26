import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { SalesChannelFaker } from '#pdv/domain/entities/fakers/index.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { ListSalesChannelsUseCase } from '#pdv/use-cases/list-sales-channels-use-case.ts'

describe('List Sales Channels Use Case', () => {
  let repository: MockProxy<SalesChannelsRepository>
  let useCase: ListSalesChannelsUseCase

  beforeEach(() => {
    repository = mock<SalesChannelsRepository>()
    repository.findMany.mockResolvedValue([
      SalesChannelFaker.fake({ id: 'z', establishmentId: 'e1', name: ' alpha ' }),
      SalesChannelFaker.fake({ id: 'b', establishmentId: 'e1', name: 'Beta' }),
      SalesChannelFaker.fake({ id: 'a', establishmentId: 'e1', name: 'Alpha' }),
      SalesChannelFaker.fake({ id: 'foreign', establishmentId: 'e2', name: '0 Foreign' }),
    ])
    useCase = new ListSalesChannelsUseCase(repository)
  })

  it('reads only the actor establishment and sorts by normalized name then id', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
      }),
    ).resolves.toMatchObject([{ id: 'a' }, { id: 'z' }, { id: 'b' }])

    expect(repository.findMany).toHaveBeenCalledWith('e1')
  })

  it('rejects operator management reads', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId: 'e1', profile: UserProfile.Operator },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(repository.findMany).not.toHaveBeenCalled()
  })
})
