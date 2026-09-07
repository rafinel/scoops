import type { NotificationCursor } from '@scoops/core/communication/domain/structures'

export type NotificationBounds = {
  occurredFrom?: Date
  occurredTo?: Date
}

function serializeBounds(bounds: NotificationBounds) {
  return {
    occurredFrom: bounds.occurredFrom?.toISOString(),
    occurredTo: bounds.occurredTo?.toISOString(),
  }
}

export const communicationQueryKeys = {
  all: ['communication'] as const,
  recent: () => [...communicationQueryKeys.all, 'recent'] as const,
  notifications: (input: NotificationBounds & { limit: number }) =>
    [
      ...communicationQueryKeys.all,
      'notifications',
      { limit: input.limit, ...serializeBounds(input) },
    ] as const,
}

export function notificationCursorKey(cursor: NotificationCursor | undefined) {
  return cursor
    ? { occurredAt: cursor.occurredAt.toISOString(), id: cursor.id }
    : undefined
}
