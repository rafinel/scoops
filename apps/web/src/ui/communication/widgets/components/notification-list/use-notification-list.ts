import { useEffect, useMemo, useRef } from 'react'

import type { Notification } from '@scoops/core/communication/domain/entities'

import { useMarkNotificationsReadAction } from '@/ui/communication/hooks/use-mark-notifications-read-action'

export type NotificationDateGroup = {
  key: string
  label: string
  notifications: readonly Notification[]
}

export type UseNotificationListInput = {
  isObservationEnabled: boolean
  notifications: readonly Notification[]
}

export function useNotificationList({
  isObservationEnabled,
  notifications,
}: UseNotificationListInput) {
  const listRef = useRef<HTMLDivElement>(null)
  const visibleIdsRef = useRef(new Set<string>())
  const submittedIdsRef = useRef(new Set<string>())
  const pendingIdsRef = useRef(new Set<string>())
  const batchTimerRef = useRef<number | null>(null)
  const { isPending, markNotificationsRead } = useMarkNotificationsReadAction()
  const notificationKeys = notifications.map((notification) => notification.id).join('|')

  const dateGroups = useMemo(() => {
    const today = new Date()
    const groups = new Map<string, NotificationDateGroup>()

    for (const notification of notifications) {
      const occurredAt = notification.occurredAt
      const key = [
        occurredAt.getFullYear(),
        occurredAt.getMonth() + 1,
        occurredAt.getDate(),
      ]
        .map((part) => String(part).padStart(2, '0'))
        .join('-')
      const isToday = occurredAt.toDateString() === today.toDateString()
      const label = isToday
        ? 'HOJE'
        : new Intl.DateTimeFormat('pt-BR', {
            day: 'numeric',
            month: 'long',
            weekday: 'long',
            year: 'numeric',
          })
            .format(occurredAt)
            .toUpperCase()
      const existing = groups.get(key)

      if (existing) {
        existing.notifications = [...existing.notifications, notification]
      } else {
        groups.set(key, { key, label, notifications: [notification] })
      }
    }

    return [...groups.values()]
  }, [notifications])

  useEffect(() => {
    void notificationKeys
    const observedNodes = new Map<Element, string>()
    const scrollRoot = listRef.current
      ? findNearestScrollContainer(listRef.current)
      : null
    const observer =
      isObservationEnabled && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const notificationId = observedNodes.get(entry.target)
                if (!notificationId) continue

                if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
                  visibleIdsRef.current.delete(notificationId)
                  continue
                }

                if (
                  visibleIdsRef.current.has(notificationId) ||
                  submittedIdsRef.current.has(notificationId)
                )
                  continue

                visibleIdsRef.current.add(notificationId)
                pendingIdsRef.current.add(notificationId)
              }

              scheduleReadBatch()
            },
            { root: scrollRoot, threshold: [0, 0.5, 1] },
          )
        : null

    if (isObservationEnabled && listRef.current) {
      const nodes = listRef.current.querySelectorAll<HTMLElement>(
        '[data-notification-id]',
      )
      for (const node of nodes) {
        const notificationId = node.dataset.notificationId
        if (!notificationId) continue
        observedNodes.set(node, notificationId)
        observer?.observe(node)
      }

      const checkVisibleRows = () => {
        const rootBounds = scrollRoot?.getBoundingClientRect() ?? {
          top: 0,
          right: window.innerWidth,
          bottom: window.innerHeight,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }

        for (const [node, notificationId] of observedNodes) {
          const bounds = node.getBoundingClientRect()
          const area = bounds.width * bounds.height
          if (area === 0) continue

          const visibleWidth = Math.max(
            0,
            Math.min(bounds.right, rootBounds.right) -
              Math.max(bounds.left, rootBounds.left),
          )
          const visibleHeight = Math.max(
            0,
            Math.min(bounds.bottom, rootBounds.bottom) -
              Math.max(bounds.top, rootBounds.top),
          )
          const intersectionRatio = (visibleWidth * visibleHeight) / area
          const isIntersecting = intersectionRatio > 0

          if (!isIntersecting || intersectionRatio < 0.5) {
            visibleIdsRef.current.delete(notificationId)
            continue
          }

          if (
            visibleIdsRef.current.has(notificationId) ||
            submittedIdsRef.current.has(notificationId)
          )
            continue

          visibleIdsRef.current.add(notificationId)
          pendingIdsRef.current.add(notificationId)
        }

        scheduleReadBatch()
      }

      checkVisibleRows()
      scrollRoot?.addEventListener('scroll', checkVisibleRows, { passive: true })
      window.addEventListener('resize', checkVisibleRows)

      return () => {
        observer?.disconnect()
        scrollRoot?.removeEventListener('scroll', checkVisibleRows)
        window.removeEventListener('resize', checkVisibleRows)
        if (batchTimerRef.current !== null) window.clearTimeout(batchTimerRef.current)
        batchTimerRef.current = null
      }
    }

    return () => {
      observer?.disconnect()
      if (batchTimerRef.current !== null) window.clearTimeout(batchTimerRef.current)
      batchTimerRef.current = null
    }

    function scheduleReadBatch() {
      if (batchTimerRef.current !== null) return

      batchTimerRef.current = window.setTimeout(() => {
        batchTimerRef.current = null
        const pendingIds = [...pendingIdsRef.current].slice(0, 50)
        if (pendingIds.length === 0) return

        for (const id of pendingIds) pendingIdsRef.current.delete(id)

        void markNotificationsRead(pendingIds)
          .then(() => {
            for (const id of pendingIds) submittedIdsRef.current.add(id)
          })
          .catch(() => {
            for (const id of pendingIds) visibleIdsRef.current.delete(id)
          })
      }, 0)
    }
  }, [isObservationEnabled, markNotificationsRead, notificationKeys])

  useEffect(() => {
    const currentIds = new Set(notifications.map((notification) => notification.id))
    for (const id of submittedIdsRef.current) {
      if (!currentIds.has(id)) submittedIdsRef.current.delete(id)
    }
    for (const id of visibleIdsRef.current) {
      if (!currentIds.has(id)) visibleIdsRef.current.delete(id)
    }
  }, [notifications])

  return {
    dateGroups,
    isMarkingRead: isPending,
    listRef,
  }
}

function findNearestScrollContainer(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement

  while (parent) {
    const styles = window.getComputedStyle(parent)
    const overflow = `${styles.overflow} ${styles.overflowY} ${styles.overflowX}`
    if (/(auto|scroll|overlay)/.test(overflow)) return parent
    parent = parent.parentElement
  }

  return null
}
