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

  it.each([
    [
      NotificationKind.UserPromoted,
      'Usuário promovido',
      'Ana agora possui o perfil Gerente.',
    ],
    [
      NotificationKind.UserDemoted,
      'Usuário alterado para Operador',
      'Ana agora possui o perfil Operador.',
    ],
    [
      NotificationKind.UserReactivated,
      'Usuário reativado',
      'O acesso de Ana foi reativado.',
    ],
  ] as const)(
    'renders the %s membership change and includes its affected user',
    async (kind, title, message) => {
      audienceProvider.findManyActiveByEstablishment.mockResolvedValue([
        { userId: 'manager-1', profile: 'manager' },
        { userId: 'target-1', profile: 'operator' },
        { userId: 'operator-2', profile: 'operator' },
      ])

      await useCase.execute({
        fact: {
          sourceEventId: `event-${kind}`,
          establishmentId: 'establishment-1',
          occurredAt,
          kind,
          affectedUserId: 'target-1',
          affectedUserName: 'Ana',
        },
      })

      expect(repository.addMany).toHaveBeenCalledWith([
        expect.objectContaining({
          sourceEventId: `event-${kind}`,
          establishmentId: 'establishment-1',
          recipientUserId: 'manager-1',
          kind,
          title,
          message,
          occurredAt,
          createdAt,
        }),
        expect.objectContaining({ recipientUserId: 'target-1', title, message }),
      ])
      expect(repository.addMany.mock.calls.at(-1)?.[0]).toHaveLength(2)
    },
  )

  it('does not write or capture a timestamp when no recipients are eligible', async () => {
    audienceProvider.findManyActiveByEstablishment.mockResolvedValue([])

    await useCase.execute({
      fact: {
        sourceEventId: 'event-empty-audience',
        establishmentId: 'establishment-1',
        occurredAt,
        kind: NotificationKind.StockZero,
        productId: 'product-1',
        productName: 'Leite',
        unit: ProductUnit.Liter,
        availableQuantity: 0,
        idealQuantity: 10,
      },
    })

    expect(repository.addMany).not.toHaveBeenCalled()
    expect(datetimeProvider.now).not.toHaveBeenCalled()
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
