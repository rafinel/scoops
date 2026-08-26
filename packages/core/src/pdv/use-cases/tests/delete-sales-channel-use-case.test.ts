import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { SalesChannelFaker } from '#pdv/domain/entities/fakers/index.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { DeleteSalesChannelUseCase } from '#pdv/use-cases/delete-sales-channel-use-case.ts'

describe('Delete Sales Channel Use Case', () => {
  let repository: MockProxy<SalesChannelsRepository>
  let useCase: DeleteSalesChannelUseCase
  const channel = SalesChannelFaker.fake({ id: 'channel-1', establishmentId: 'e1' })

  beforeEach(() => {
    repository = mock<SalesChannelsRepository>()
    repository.findById.mockResolvedValue(channel)
    useCase = new DeleteSalesChannelUseCase(repository)
  })

  it('removes a tenant channel without touching snapshot data', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
      }),
    ).resolves.toBeUndefined()
    expect(repository.remove).toHaveBeenCalledWith('e1', channel.id)
  })

  it('conceals foreign or missing channels and rejects operators without removing', async () => {
    repository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    repository.findById.mockResolvedValue(
      SalesChannelFaker.fake({ id: channel.id, establishmentId: 'e2' }),
    )
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId: 'e1', profile: UserProfile.Operator },
        channelId: channel.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(repository.remove).not.toHaveBeenCalled()
  })
})
