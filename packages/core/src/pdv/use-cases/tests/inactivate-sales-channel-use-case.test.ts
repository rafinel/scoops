import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { SalesChannelFaker } from '#pdv/domain/entities/fakers/index.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import { InactivateSalesChannelUseCase } from '#pdv/use-cases/inactivate-sales-channel-use-case.ts'

describe('Inactivate Sales Channel Use Case', () => {
  let repository: MockProxy<SalesChannelsRepository>
  let useCase: InactivateSalesChannelUseCase
  const channel = SalesChannelFaker.fake({
    id: 'channel-1',
    establishmentId: 'e1',
    status: SalesChannelStatus.Active,
  })

  beforeEach(() => {
    repository = mock<SalesChannelsRepository>()
    repository.findById.mockResolvedValue(channel)
    repository.replace.mockResolvedValue({
      ...channel,
      status: SalesChannelStatus.Inactive,
    })
    useCase = new InactivateSalesChannelUseCase(repository)
  })

  it('inactivates an active channel once with a tenant-qualified status replacement', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
      }),
    ).resolves.toMatchObject({ status: SalesChannelStatus.Inactive })
    expect(repository.replace).toHaveBeenCalledWith('e1', channel.id, {
      status: SalesChannelStatus.Inactive,
    })
  })

  it('is idempotent and conceals missing or foreign channels from operators', async () => {
    repository.findById.mockResolvedValue({
      ...channel,
      status: SalesChannelStatus.Inactive,
    })
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
      }),
    ).resolves.toMatchObject({ status: SalesChannelStatus.Inactive })
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
