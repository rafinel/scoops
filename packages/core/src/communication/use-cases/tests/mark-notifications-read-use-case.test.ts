import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { NotificationActorFaker } from '#communication/domain/structures/fakers/index.ts'
import { NotificationActorProfile } from '#communication/domain/structures/notification-actor.ts'
import type { NotificationsRepository } from '#communication/interfaces/notifications-repository.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import { MarkNotificationsReadUseCase } from '#communication/use-cases/mark-notifications-read-use-case.ts'

describe('Mark Notifications Read Use Case', () => {
  let repository: MockProxy<NotificationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: MarkNotificationsReadUseCase

  beforeEach(() => {
    repository = mock<NotificationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(new Date('2026-01-01T00:00:00.000Z'))
    repository.markRead.mockResolvedValue(['notification-1'])
    useCase = new MarkNotificationsReadUseCase(repository, datetimeProvider)
  })

  it('deduplicates IDs and captures one read timestamp under actor scope', async () => {
    const actor = NotificationActorFaker.fake({
      profile: NotificationActorProfile.Operator,
    })
    const result = await useCase.execute({
      actor,
      notificationIds: ['notification-1', ' notification-1 ', 'notification-2'],
    })

    expect(result).toEqual(['notification-1'])
    expect(repository.markRead).toHaveBeenCalledWith({
      establishmentId: actor.establishmentId,
      recipientUserId: actor.id,
      notificationIds: ['notification-1', 'notification-2'],
      readAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    expect(datetimeProvider.now).toHaveBeenCalledTimes(1)
  })

  it('does not write an empty batch', async () => {
    await expect(
      useCase.execute({
        actor: NotificationActorFaker.fake(),
        notificationIds: [],
      }),
    ).rejects.toThrow()
    expect(repository.markRead).not.toHaveBeenCalled()
  })
})
