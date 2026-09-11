import { useEffect, useRef } from 'react'

import type { Notification } from '@scoops/core/communication/domain/entities'
import {
  notificationRealtimeEventSchema,
  type NotificationRealtimeEvent,
} from '@scoops/validation'

import {
  createNotificationRealtimeClient,
  type NotificationEventSource,
} from '@/provision/communication/event-source/notification-realtime-client'

const NOTIFICATION_CREATED_EVENT = 'notification.created'
const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000] as const

type NotificationRealtimeListener = (notification: Notification) => Promise<void> | void

const listeners = new Set<NotificationRealtimeListener>()
let client: NotificationEventSource | null = null
let retryAttempt = 0
let retryTimer: number | null = null

function handleNotification(event: Event) {
  const notification = parseNotification(event)
  if (notification === null) return

  notifyListeners(notification)
}

function notifyListeners(notification: Notification) {
  for (const listener of listeners) {
    void Promise.resolve()
      .then(() => listener(notification))
      .catch(() => undefined)
  }
}

function handleOpen() {
  retryAttempt = 0
}

function handleError() {
  if (client === null) return

  closeClient()
  scheduleRetry()
}

function connect() {
  if (!canConnect()) return

  try {
    client = createClient()
  } catch {
    scheduleRetry()
  }
}

function canConnect() {
  return listeners.size !== 0 && client === null && retryTimer === null
}

function createClient(): NotificationEventSource {
  const nextClient = createNotificationRealtimeClient()
  nextClient.addEventListener(NOTIFICATION_CREATED_EVENT, handleNotification)
  nextClient.onopen = handleOpen
  nextClient.onerror = handleError
  return nextClient
}

function scheduleRetry() {
  if (listeners.size === 0 || retryTimer !== null) return

  retryTimer = window.setTimeout(retry, getRetryDelay())
}

function getRetryDelay() {
  const baseDelay = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)]
  retryAttempt += 1
  return Math.round(baseDelay * (0.8 + Math.random() * 0.4))
}

function retry() {
  retryTimer = null
  connect()
}

function clearRetry() {
  if (retryTimer === null) return

  window.clearTimeout(retryTimer)
  retryTimer = null
}

function closeClient() {
  const currentClient = client
  client = null
  if (currentClient === null) return

  detachClient(currentClient)
}

function detachClient(currentClient: NotificationEventSource) {
  currentClient.removeEventListener(NOTIFICATION_CREATED_EVENT, handleNotification)
  currentClient.onopen = null
  currentClient.onerror = null
  currentClient.close()
}

function parseNotification(event: Event): Notification | null {
  const eventData = getEventData(event)
  if (eventData === null) return null

  try {
    return parseNotificationData(eventData)
  } catch {
    return null
  }
}

function getEventData(event: Event): string | null {
  const eventData = (event as MessageEvent).data
  return typeof eventData === 'string' ? eventData : null
}

function parseNotificationData(eventData: string): Notification {
  const parsed = notificationRealtimeEventSchema.parse(JSON.parse(eventData))
  return mapNotification(parsed.notification)
}

function mapNotification(
  notification: NotificationRealtimeEvent['notification'],
): Notification {
  return {
    ...notification,
    occurredAt: new Date(notification.occurredAt),
    createdAt: new Date(notification.createdAt),
    readAt: notification.readAt ? new Date(notification.readAt) : undefined,
  }
}

function subscribe(listener: NotificationRealtimeListener) {
  listeners.add(listener)
  connect()

  return function unsubscribe() {
    listeners.delete(listener)
    if (listeners.size !== 0) return

    clearRetry()
    closeClient()
    retryAttempt = 0
  }
}

export type UseNotificationRealtimeInput = {
  enabled: boolean
  onNotificationCreated: (notification: Notification) => Promise<void> | void
}

export function useNotificationRealtime({
  enabled,
  onNotificationCreated,
}: UseNotificationRealtimeInput): void {
  const onNotificationCreatedRef = useRef(onNotificationCreated)
  onNotificationCreatedRef.current = onNotificationCreated

  useEffect(() => {
    if (!enabled) return

    return subscribe((notification) => onNotificationCreatedRef.current(notification))
  }, [enabled])
}
