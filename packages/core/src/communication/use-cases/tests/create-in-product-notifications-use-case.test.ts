import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { NotificationCreate } from '#communication/domain/structures/notification-create.ts'
import { NotificationKind } from '#communication/domain/structures/notification-kind.ts'
import type { NotificationAudienceProvider } from '#communication/interfaces/notification-audience-provider.ts'
import type { NotificationsRepository } from '#communication/interfaces/notifications-repository.ts'
import { CreateInProductNotificationsUseCase } from '#communication/use-cases/create-in-product-notifications-use-case.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

const occurredAt = new Date('2026-01-01T00:00:00.000Z')
const createdAt = new Date('2026-01-01T00:01:00.000Z')

describe('Create In Product Notifications Use Case', () => {
  let repository: MockProxy<NotificationsRepository>
  let audienceProvider: MockProxy<NotificationAudienceProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: CreateInProductNotificationsUseCase

  beforeEach(() => {
    repository = mock<NotificationsRepository>()
    audienceProvider = mock<NotificationAudienceProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(createdAt)
    useCase = new CreateInProductNotificationsUseCase(
      repository,
      audienceProvider,
      datetimeProvider,
    )
  })

  it('creates one immutable stock snapshot for every deduplicated audience member', async () => {
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: 'manager-1', profile: 'manager' },
      { userId: 'manager-1', profile: 'manager' },
      { userId: 'operator-1', profile: 'operator' },
    ])

    await useCase.execute({
      fact: {
        sourceEventId: 'event-1',
        establishmentId: 'establishment-1',
        occurredAt,
        kind: NotificationKind.StockBelowIdeal,
        productId: 'product-1',
        productName: 'Leite',
        unit: ProductUnit.Liter,
        availableQuantity: 2.5,
        idealQuantity: 10,
      },
    })

    expect(repository.addMany).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'manager-1',
        title: 'Estoque abaixo do ideal',
        message: 'Leite está com 2,5 l disponíveis. Ideal: 10 l.',
        occurredAt,
        createdAt,
      }),
      expect.objectContaining({ recipientUserId: 'operator-1' }),
    ] satisfies readonly NotificationCreate[])
  })

  it('excludes a newly activated user and includes an inactivated target', async () => {
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: 'manager-1', profile: 'manager' },
      { userId: 'target-1', profile: 'operator' },
    ])

    await useCase.execute({
      fact: {
        sourceEventId: 'event-added',
        establishmentId: 'establishment-1',
        occurredAt,
        kind: NotificationKind.UserAdded,
        affectedUserId: 'target-1',
        affectedUserName: 'Ana',
      },
    })
    expect(repository.addMany).toHaveBeenLastCalledWith([
      expect.objectContaining({ recipientUserId: 'manager-1' }),
    ])

    await useCase.execute({
      fact: {
        sourceEventId: 'event-inactive',
        establishmentId: 'establishment-1',
        occurredAt,
        kind: NotificationKind.UserInactivated,
        affectedUserId: 'target-1',
        affectedUserName: 'Ana',
      },
    })
    expect(repository.addMany).toHaveBeenLastCalledWith([
      expect.objectContaining({ recipientUserId: 'manager-1' }),
      expect.objectContaining({ recipientUserId: 'target-1' }),
    ])
  })

  it('stores the available zero quantity and unit in the stock-zero snapshot', async () => {
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
      { userId: 'manager-1', profile: 'manager' },
    ])

    await useCase.execute({
      fact: {
        sourceEventId: 'event-zero',
        establishmentId: 'establishment-1',
        occurredAt,
        kind: NotificationKind.StockZero,
        productId: 'product-1',
        productName: 'Leite',
        unit: ProductUnit.Liter,
        availableQuantity: -2,
        idealQuantity: 10,
      },
    })

    expect(repository.addMany).toHaveBeenLastCalledWith([
      expect.objectContaining({
        title: 'Estoque zerado',
        message: 'Leite está com -2 l disponíveis.',
      }),
    ])
  })
})
