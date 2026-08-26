import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { SalesChannelFaker } from '#pdv/domain/entities/fakers/index.ts'
import { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import type { SalesChannelsRepository } from '#pdv/interfaces/sales-channels-repository.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import { CreateSalesChannelUseCase } from '#pdv/use-cases/create-sales-channel-use-case.ts'

describe('Create Sales Channel Use Case', () => {
  let repository: MockProxy<SalesChannelsRepository>
  let useCase: CreateSalesChannelUseCase

  beforeEach(() => {
    repository = mock<SalesChannelsRepository>()
    repository.findByNormalizedName.mockResolvedValue(undefined)
    repository.add.mockResolvedValue(
      SalesChannelFaker.fake({ establishmentId: 'e1', name: 'Delivery próprio' }),
    )
    useCase = new CreateSalesChannelUseCase(repository)
  })

  it('trims the name and creates one channel within the actor establishment', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager },
        name: '  Delivery próprio  ',
        percentage: 12.5,
        status: SalesChannelStatus.Active,
      }),
    ).resolves.toBeDefined()

    expect(repository.findByNormalizedName).toHaveBeenCalledWith('e1', 'delivery próprio')
    expect(repository.add).toHaveBeenCalledWith({
      establishmentId: 'e1',
      name: 'Delivery próprio',
      percentage: 12.5,
      status: SalesChannelStatus.Active,
    })
  })

  it('rejects invalid bounds, status, duplicates and non-manager actors without adding', async () => {
    const actor = { id: 'manager-1', establishmentId: 'e1', profile: UserProfile.Manager }

    await expect(
      useCase.execute({
        actor,
        name: ' ',
        percentage: 1,
        status: SalesChannelStatus.Active,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor,
        name: 'x'.repeat(121),
        percentage: 1,
        status: SalesChannelStatus.Active,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    for (const percentage of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1.234,
      -100,
      100.01,
    ]) {
      await expect(
        useCase.execute({
          actor,
          name: 'Delivery',
          percentage,
          status: SalesChannelStatus.Active,
        }),
      ).rejects.toBeInstanceOf(BadRequestError)
    }

    await expect(
      useCase.execute({
        actor,
        name: 'Delivery',
        percentage: 1,
        status: 'unknown' as SalesChannelStatus,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    repository.findByNormalizedName.mockResolvedValue(
      SalesChannelFaker.fake({ establishmentId: 'e1' }),
    )
    await expect(
      useCase.execute({
        actor,
        name: ' delivery ',
        percentage: 1,
        status: SalesChannelStatus.Active,
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        name: 'New',
        percentage: 1,
        status: SalesChannelStatus.Active,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(repository.add).not.toHaveBeenCalled()
  })
})
