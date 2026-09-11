import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { Notification } from '@scoops/core/communication/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { showNotificationToast } from '@/ui/shared/notifications'
import { communicationQueryKeys } from '@/ui/communication/hooks/communication-query-keys'

const LOCK_NAME = 'scoops-notifications-leader'
const LEASE_KEY = 'scoops-notifications-leader-lease'
const CHANNEL_NAME = 'scoops-notifications'
const LEASE_DURATION_MS = 10_000
const LEASE_RENEWAL_MS = 3_000
const INVALIDATION_MESSAGE_VERSION = 1

type NotificationLease = { expiresAt: number; ownerId: string }

export function useNotificationShellProvider() {
  const { account, status } = useAuthContext()
  const queryClient = useQueryClient()
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(
    null,
  )
  const isEligible =
    status === 'authenticated' &&
    account !== null &&
    (account.profile === UserProfile.Manager || account.profile === UserProfile.Operator)
  const authScope = `${status}:${account?.id ?? ''}:${account?.establishmentId ?? ''}`
  const openNotification = useCallback((notification: Notification) => {
    setSelectedNotification(notification)
    setNotificationsOpen(true)
  }, [])
  const openNotifications = useCallback(() => setNotificationsOpen(true), [])
  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false)
    setSelectedNotification(null)
  }, [])
  const clearSelectedNotification = useCallback(() => {
    setSelectedNotification(null)
  }, [])
  const leadership = useNotificationLeadership(authScope, isEligible, queryClient)
  const queue = useNotificationQueue(
    account,
    queryClient,
    leadership.channel,
    openNotification,
  )

  const identityKey = `${account?.id ?? ''}:${account?.establishmentId ?? ''}`
  const previousIdentityKeyRef = useRef(identityKey)
  useEffect(() => {
    if (previousIdentityKeyRef.current === identityKey) return
    previousIdentityKeyRef.current = identityKey
    setNotificationsOpen(false)
    setSelectedNotification(null)
    queue.clearNotifications()
  }, [identityKey, queue.clearNotifications])

  return useMemo(
    () => ({
      account,
      clearSelectedNotification,
      closeNotifications,
      dismissNotification: queue.dismissNotification,
      isEligible,
      isLeader: leadership.isLeader,
      isNotificationsOpen,
      notificationChannel: leadership.channel,
      onNotification: queue.handleNotification,
      openNotification,
      openNotifications,
      queuedNotifications: queue.queuedNotifications,
      selectedNotification,
      visibleNotifications: queue.visibleNotifications,
    }),
    [
      account,
      clearSelectedNotification,
      closeNotifications,
      leadership.channel,
      leadership.isLeader,
      queue.dismissNotification,
      queue.handleNotification,
      queue.queuedNotifications,
      queue.visibleNotifications,
      isEligible,
      isNotificationsOpen,
      openNotification,
      openNotifications,
      selectedNotification,
    ],
  )
}

function useNotificationLeadership(
  authScope: string,
  isEligible: boolean,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  const [isLeader, setIsLeader] = useState(false)
  const [isRealtimeAvailable, setIsRealtimeAvailable] = useState(
    isRealtimeEnvironmentAvailable,
  )
  const ownerIdRef = useRef(
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36),
  )
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const updateAvailability = () => {
      setIsRealtimeAvailable(isRealtimeEnvironmentAvailable())
    }

    document.addEventListener('visibilitychange', updateAvailability)
    window.addEventListener('online', updateAvailability)
    window.addEventListener('offline', updateAvailability)
    updateAvailability()

    return () => {
      document.removeEventListener('visibilitychange', updateAvailability)
      window.removeEventListener('online', updateAvailability)
      window.removeEventListener('offline', updateAvailability)
    }
  }, [])

  useEffect(() => {
    if (!isEligible || !authScope || !isRealtimeAvailable) {
      setIsLeader(false)
      return
    }

    const coordination = createCoordinationScope(authScope)
    const cleanup = acquireLeadership(
      ownerIdRef.current,
      coordination.leaseKey,
      coordination.lockName,
      setIsLeader,
    )
    const channel = createChannel(coordination.channelName)
    channelRef.current = channel
    const handleMessage = (event: MessageEvent) => {
      if (isNotificationInvalidationMessage(event.data, authScope)) {
        void queryClient.invalidateQueries({ queryKey: communicationQueryKeys.all })
      }
    }

    channel?.addEventListener('message', handleMessage)
    return () => {
      channel?.removeEventListener('message', handleMessage)
      channel?.close()
      channelRef.current = null
      cleanup()
      setIsLeader(false)
    }
  }, [authScope, isEligible, isRealtimeAvailable, queryClient])

  return { channel: channelRef.current, isLeader }
}

function useNotificationQueue(
  account: ReturnType<typeof useAuthContext>['account'],
  queryClient: ReturnType<typeof useQueryClient>,
  channel: BroadcastChannel | null,
  onOpen: (notification: Notification) => void,
) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([])
  const [queuedNotifications, setQueuedNotifications] = useState<Notification[]>([])
  const visibleIdsRef = useRef(new Set<string>())
  const seenIdsRef = useRef(new Set<string>())
  const queuedRef = useRef<Notification[]>([])
  const toastIdsRef = useRef(new Map<string, string | number>())
  const processingRef = useRef(Promise.resolve())
  const generationRef = useRef(0)
  const identityKey = `${account?.id ?? ''}:${account?.establishmentId ?? ''}`

  const dismissNotification = useCallback((notificationId: string) => {
    visibleIdsRef.current.delete(notificationId)
    const toastId = toastIdsRef.current.get(notificationId)
    if (toastId !== undefined) {
      toast.dismiss(toastId)
      toastIdsRef.current.delete(notificationId)
    }
    setVisibleNotifications((notifications) =>
      notifications.filter((notification) => notification.id !== notificationId),
    )
    queuedRef.current = queuedRef.current.filter(
      (notification) => notification.id !== notificationId,
    )
    setQueuedNotifications(queuedRef.current)
  }, [])

  const clearNotifications = useCallback(() => {
    generationRef.current += 1
    for (const toastId of toastIdsRef.current.values()) toast.dismiss(toastId)
    toastIdsRef.current.clear()
    visibleIdsRef.current.clear()
    seenIdsRef.current.clear()
    queuedRef.current = []
    setVisibleNotifications([])
    setQueuedNotifications([])
  }, [])

  const presentNotification = useCallback(
    (notification: Notification) => {
      visibleIdsRef.current.add(notification.id)
      setVisibleNotifications((current) => [notification, ...current])
      const toastId = showNotificationToast(notification, {
        onDismiss: () => dismissNotification(notification.id),
        onOpen: () => onOpen(notification),
      })
      if (toastId !== null && toastId !== undefined) {
        toastIdsRef.current.set(notification.id, toastId)
      }
    },
    [dismissNotification, onOpen],
  )

  useEffect(() => {
    const hasVisibleCapacity = visibleNotifications.length < 3
    if (
      !hasVisibleCapacity ||
      visibleIdsRef.current.size >= 3 ||
      queuedRef.current.length === 0
    )
      return
    const [next, ...rest] = queuedRef.current
    queuedRef.current = rest
    setQueuedNotifications(rest)
    if (next) presentNotification(next)
  }, [presentNotification, visibleNotifications.length])

  const handleNotification = useCallback(
    (notification: Notification) => {
      if (seenIdsRef.current.has(notification.id)) return processingRef.current
      seenIdsRef.current.add(notification.id)
      const generation = generationRef.current

      const processNotification = async () => {
        if (!isNotificationForAccount(notification, account)) return
        await queryClient.invalidateQueries({ queryKey: communicationQueryKeys.all })
        if (generation !== generationRef.current) return
        channel?.postMessage({
          type: 'notifications.invalidate',
          version: INVALIDATION_MESSAGE_VERSION,
          authScope: identityKey,
        })
        if (visibleIdsRef.current.size >= 3) {
          queuedRef.current = [...queuedRef.current, notification]
          setQueuedNotifications(queuedRef.current)
          return
        }
        presentNotification(notification)
      }

      const next = processingRef.current.then(processNotification)
      processingRef.current = next.catch(() => undefined)
      return next
    },
    [account, channel, identityKey, presentNotification, queryClient],
  )

  useEffect(() => {
    return () => clearNotifications()
  }, [clearNotifications])

  return {
    clearNotifications,
    dismissNotification,
    handleNotification,
    queuedNotifications,
    visibleNotifications,
  }
}

function isNotificationForAccount(
  notification: Notification,
  account: ReturnType<typeof useAuthContext>['account'],
) {
  return Boolean(
    account &&
      notification.recipientUserId === account.id &&
      notification.establishmentId === account.establishmentId,
  )
}

function createChannel(channelName: string): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(channelName)
}

function acquireLeadership(
  ownerId: string,
  leaseKey: string,
  lockName: string,
  setLeader: (isLeader: boolean) => void,
) {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    let releaseLock: (() => void) | null = null
    let isActive = true
    let retryTimer: number | null = null

    const scheduleRetry = () => {
      if (!isActive || retryTimer !== null) return
      retryTimer = window.setTimeout(() => {
        retryTimer = null
        attempt()
      }, LEASE_RENEWAL_MS)
    }

    const attempt = () => {
      if (!isActive) return
      void navigator.locks.request(lockName, { ifAvailable: true }, (lock) => {
        if (!lock || !isActive) {
          setLeader(false)
          scheduleRetry()
          return undefined
        }
        setLeader(true)
        return new Promise<void>((resolve) => {
          releaseLock = resolve
        })
      })
    }

    attempt()
    return () => {
      isActive = false
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      releaseLock?.()
      setLeader(false)
    }
  }

  return acquireLease(ownerId, leaseKey, setLeader)
}

function acquireLease(
  ownerId: string,
  leaseKey: string,
  setLeader: (isLeader: boolean) => void,
) {
  let isLeader = false
  const renew = () => {
    const current = readLease(leaseKey)
    if (!current || current.expiresAt <= Date.now() || current.ownerId === ownerId) {
      writeLease(leaseKey, { ownerId, expiresAt: Date.now() + LEASE_DURATION_MS })
      isLeader = true
      setLeader(true)
      return
    }
    isLeader = false
    setLeader(false)
  }
  renew()
  const timer = window.setInterval(renew, LEASE_RENEWAL_MS)
  return () => {
    window.clearInterval(timer)
    if (isLeader && readLease(leaseKey)?.ownerId === ownerId)
      localStorage.removeItem(leaseKey)
    setLeader(false)
  }
}

function readLease(leaseKey: string): NotificationLease | null {
  try {
    const value = localStorage.getItem(leaseKey)
    return value ? (JSON.parse(value) as NotificationLease) : null
  } catch {
    return null
  }
}

function writeLease(leaseKey: string, lease: NotificationLease) {
  try {
    localStorage.setItem(leaseKey, JSON.stringify(lease))
  } catch {
    // Cross-tab coordination is best effort in restricted browser storage modes.
  }
}

function isRealtimeEnvironmentAvailable() {
  return (
    typeof document !== 'undefined' &&
    document.visibilityState === 'visible' &&
    (typeof navigator === 'undefined' || navigator.onLine !== false)
  )
}

function createCoordinationScope(authScope: string) {
  const encodedScope = encodeURIComponent(authScope)
  return {
    channelName: `${CHANNEL_NAME}:${encodedScope}`,
    leaseKey: `${LEASE_KEY}:${encodedScope}`,
    lockName: `${LOCK_NAME}:${encodedScope}`,
  }
}

function isNotificationInvalidationMessage(
  value: unknown,
  authScope: string,
): value is {
  authScope: string
  type: 'notifications.invalidate'
  version: typeof INVALIDATION_MESSAGE_VERSION
} {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>
  return (
    message.type === 'notifications.invalidate' &&
    message.version === INVALIDATION_MESSAGE_VERSION &&
    message.authScope === authScope
  )
}
