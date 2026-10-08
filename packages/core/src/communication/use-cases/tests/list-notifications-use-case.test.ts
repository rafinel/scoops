import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { NotificationActorFaker } from '#communication/domain/structures/fakers/index.ts'
import { NotificationActorProfile } from '#communication/domain/structures/notification-actor.ts'
import type { NotificationPage } from '#communication/domain/structures/notification-page.ts'
import type { NotificationsRepository } from '#communication/interfaces/notifications-repository.ts'
import { AuthorizationError, BadRequestError } from '#shared/domain/errors/index.ts'
import { ListNotificationsUseCase } from '#communication/use-cases/list-notifications-use-case.ts'

const page: NotificationPage = { items: [], unreadCount: 0 }

describe('List Notifications Use Case', () => {
  let repository: MockProxy<NotificationsRepository>
  let useCase: ListNotificationsUseCase

  beforeEach(() => {
    repository = mock<NotificationsRepository>()
    repository.findPage.mockResolvedValue(page)
    useCase = new ListNotificationsUseCase(repository)
  })

  it('derives tenant and recipient scope from the actor', async () => {
    const actor = NotificationActorFaker.fake({
      profile: NotificationActorProfile.Operator,
    })
    const occurredFrom = new Date('2026-01-01T00:00:00.000Z')
    const occurredTo = new Date('2026-01-30T23:59:59.999Z')

    await expect(
      useCase.execute({ actor, limit: 20, occurredFrom, occurredTo }),
    ).resolves.toBe(page)
    expect(repository.findPage).toHaveBeenCalledWith({
      establishmentId: actor.establishmentId,
      recipientUserId: actor.id,
      limit: 20,
      occurredFrom,
      occurredTo,
    })
  })

  it('forwards cursor and inclusive time bounds to the actor-scoped page query', async () => {
    const actor = NotificationActorFaker.fake({
      profile: NotificationActorProfile.Manager,
    })
    const occurredFrom = new Date('2026-01-01T00:00:00.000Z')
    const occurredTo = new Date('2026-01-31T00:00:00.000Z')
    const cursor = { occurredAt: new Date('2026-01-15T12:00:00.000Z'), id: 'cursor-1' }

    await expect(
      useCase.execute({ actor, limit: 1, occurredFrom, occurredTo, cursor }),
    ).resolves.toBe(page)
    expect(repository.findPage).toHaveBeenCalledWith({
      establishmentId: actor.establishmentId,
      recipientUserId: actor.id,
      limit: 1,
      occurredFrom,
      occurredTo,
      cursor,
    })
  })

  it('rejects invalid cursors and backwards time bounds before reading', async () => {
    const actor = NotificationActorFaker.fake({
      profile: NotificationActorProfile.Manager,
    })
    await expect(
      useCase.execute({
        actor,
        limit: 50,
        cursor: { occurredAt: '2026-01-01' as unknown as Date, id: 'cursor-1' },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor,
        limit: 50,
        cursor: { occurredAt: new Date('2026-01-01T00:00:00Z'), id: '  ' },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor,
        limit: 50,
        occurredFrom: new Date('2026-02-01T00:00:00Z'),
        occurredTo: new Date('2026-01-31T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(repository.findPage).not.toHaveBeenCalled()
  })

  it('rejects unauthorized actors and invalid bounds before reading', async () => {
    const actor = NotificationActorFaker.fake({
      profile: 'pending' as NotificationActorProfile,
    })
    await expect(useCase.execute({ actor, limit: 20 })).rejects.toBeInstanceOf(
      AuthorizationError,
    )
    await expect(
      useCase.execute({
        actor: NotificationActorFaker.fake({
          profile: NotificationActorProfile.Manager,
        }),
        limit: 51,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(repository.findPage).not.toHaveBeenCalled()
  })
})
