import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { SalesChannelFaker } from '#pdv/domain/entities/fakers/index.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { ListActiveSalesChannelsUseCase } from '#pdv/use-cases/list-active-sales-channels-use-case.ts'

describe('List Active Sales Channels Use Case', () => {
  let repository: MockProxy<SalesChannelsRepository>
  let useCase: ListActiveSalesChannelsUseCase

  beforeEach(() => {
    repository = mock<SalesChannelsRepository>()
    repository.findActive.mockResolvedValue([
      SalesChannelFaker.fake({ id: 'z', establishmentId: 'e1', name: 'beta' }),
      SalesChannelFaker.fake({
        id: 'a',
        establishmentId: 'e1',
        name: 'Alpha',
        status: SalesChannelStatus.Inactive,
      }),
      SalesChannelFaker.fake({ id: 'foreign', establishmentId: 'e2', name: 'Foreign' }),
    ])
    useCase = new ListActiveSalesChannelsUseCase(repository)
  })

  it('allows managers and operators to read only active, tenant-scoped channels', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId: 'e1', profile: UserProfile.Operator },
      }),
    ).resolves.toMatchObject([{ id: 'z', status: SalesChannelStatus.Active }])
    expect(repository.findActive).toHaveBeenCalledWith('e1')

    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
      }),
    ).resolves.toMatchObject([{ id: 'z' }])
  })

  it('rejects unsupported profiles without reading', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'actor-1',
          establishmentId: 'e1',
          profile: 'unknown' as UserProfile,
        },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(repository.findActive).not.toHaveBeenCalled()
  })
})
