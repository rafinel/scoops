import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { SalesChannelFaker } from '#pdv/domain/entities/fakers/index.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { UpdateSalesChannelUseCase } from '#pdv/use-cases/update-sales-channel-use-case.ts'

describe('Update Sales Channel Use Case', () => {
  let repository: MockProxy<SalesChannelsRepository>
  let useCase: UpdateSalesChannelUseCase
  const channel = SalesChannelFaker.fake({
    id: 'channel-1',
    establishmentId: 'e1',
    name: 'Delivery',
  })

  beforeEach(() => {
    repository = mock<SalesChannelsRepository>()
    repository.findById.mockResolvedValue(channel)
    repository.findByNormalizedName.mockResolvedValue(undefined)
    repository.replace.mockResolvedValue({
      ...channel,
      name: 'Counter',
      percentage: -12.5,
    })
    useCase = new UpdateSalesChannelUseCase(repository)
  })

  it('normalizes the name and updates only name and percentage for the tenant', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
        name: '  Counter  ',
        percentage: -12.5,
      }),
    ).resolves.toMatchObject({ name: 'Counter', percentage: -12.5 })

    expect(repository.findById).toHaveBeenCalledWith('e1', channel.id)
    expect(repository.findByNormalizedName).toHaveBeenCalledWith('e1', 'counter')
    expect(repository.replace).toHaveBeenCalledWith('e1', channel.id, {
      name: 'Counter',
      percentage: -12.5,
    })
  })

  it('allows the current normalized name but rejects duplicates, invalid values and concealed targets', async () => {
    repository.findByNormalizedName.mockResolvedValue(channel)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
        name: ' delivery ',
        percentage: 0,
      }),
    ).resolves.toBeDefined()

    repository.findByNormalizedName.mockResolvedValue(
      SalesChannelFaker.fake({ id: 'other', establishmentId: 'e1' }),
    )
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
        name: 'Counter',
        percentage: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
        name: 'Counter',
        percentage: 1.001,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    repository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        channelId: channel.id,
        name: 'Counter',
        percentage: 0,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId: 'e1', profile: UserProfile.Operator },
        channelId: channel.id,
        name: 'Counter',
        percentage: 0,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
