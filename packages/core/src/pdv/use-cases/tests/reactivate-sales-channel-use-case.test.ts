import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { SalesChannelFaker } from '#pdv/domain/entities/fakers/index.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { ReactivateSalesChannelUseCase } from '#pdv/use-cases/reactivate-sales-channel-use-case.ts'

describe('Reactivate Sales Channel Use Case', () => {
  let repository: MockProxy<SalesChannelsRepository>
  let useCase: ReactivateSalesChannelUseCase
  const channel = SalesChannelFaker.fake({
    id: 'channel-1',
    establishmentId: 'e1',
    status: SalesChannelStatus.Inactive,
  })

  beforeEach(() => {
    repository = mock<SalesChannelsRepository>()
    repository.findById.mockResolvedValue(channel)
    repository.replace.mockResolvedValue({
      ...channel,
      status: SalesChannelStatus.Active,
    })
    useCase = new ReactivateSalesChannelUseCase(repository)
  })

  it('reactivates an inactive channel once with a tenant-qualified status replacement', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
      }),
    ).resolves.toMatchObject({ status: SalesChannelStatus.Active })
    expect(repository.replace).toHaveBeenCalledWith('e1', channel.id, {
      status: SalesChannelStatus.Active,
    })
  })

  it('is idempotent and conceals missing or foreign channels from operators', async () => {
    repository.findById.mockResolvedValue({
      ...channel,
      status: SalesChannelStatus.Active,
    })
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
      }),
    ).resolves.toMatchObject({ status: SalesChannelStatus.Active })
    expect(repository.replace).not.toHaveBeenCalled()

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
  })
})
