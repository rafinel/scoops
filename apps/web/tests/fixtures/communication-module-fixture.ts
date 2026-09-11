import type { Page } from '@playwright/test'

export type NotificationJson = {
  id: string
  sourceEventId: string
  establishmentId: string
  recipientUserId: string
  kind: string
  title: string
  message: string
  occurredAt: string
  createdAt: string
  readAt?: string
}

export type CommunicationModuleFixtureOptions = {
  delayMs?: number
  managerNotifications?: readonly NotificationJson[]
  operatorNotifications?: readonly NotificationJson[]
}

export type CommunicationModuleFixture = {
  listRequests: URL[]
  readRequests: Array<{ ids: string[]; url: URL }>
  failNextListRequest: (count?: number) => void
  mockNotifications: (options?: CommunicationModuleFixtureOptions) => Promise<void>
}

export const CommunicationModuleFixture = (page: Page): CommunicationModuleFixture => {
  let delayMs = 0
  let listFailureCount = 0
  let managerNotifications: NotificationJson[] = []
  let operatorNotifications: NotificationJson[] = []
  const listRequests: URL[] = []
  const readRequests: Array<{ ids: string[]; url: URL }> = []

  return {
    listRequests,
    readRequests,
    failNextListRequest(count = 1) {
      listFailureCount = count
    },
    async mockNotifications(options = {}) {
      delayMs = options.delayMs ?? 0
      managerNotifications = [...(options.managerNotifications ?? [])]
      operatorNotifications = [...(options.operatorNotifications ?? [])]

      await page.route('**/notifications**', async (route) => {
        if (
          route.request().method() === 'GET' &&
          route.request().resourceType() === 'eventsource'
        ) {
          await route.fulfill({
            headers: {
              'access-control-allow-credentials': 'true',
              'access-control-allow-origin': 'http://localhost:4001',
              'cache-control': 'no-cache',
            },
            status: 204,
          })
          return
        }
        if (
          route.request().method() === 'GET' &&
          !['fetch', 'xhr'].includes(route.request().resourceType())
        ) {
          await route.continue()
          return
        }
        if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))

        const requestUrl = new URL(route.request().url())
        const headers = route.request().headers()
        const authHeader = headers['x-scoops-playwright-auth']
        let isOperator = (headers.cookie ?? '').includes('browser-operator-session')
        if (authHeader) {
          try {
            const auth = JSON.parse(decodeURIComponent(authHeader)) as {
              body?: { profile?: string }
            }
            isOperator = auth.body?.profile === 'operator'
          } catch {
            // Keep the cookie fallback for non-test requests with an unrelated header.
          }
        }
        const notifications = isOperator ? operatorNotifications : managerNotifications

        if (requestUrl.pathname.endsWith('/read')) {
          const body = route.request().postDataJSON() as { notificationIds?: string[] }
          const ids = body.notificationIds ?? []
          const readAt = new Date().toISOString()
          for (const notification of notifications) {
            if (ids.includes(notification.id)) notification.readAt = readAt
          }
          readRequests.push({ ids, url: requestUrl })
          await route.fulfill({
            contentType: 'application/json',
            status: 200,
            body: JSON.stringify({ notificationIds: ids }),
          })
          return
        }

        listRequests.push(requestUrl)
        if (listFailureCount > 0) {
          listFailureCount -= 1
          await route.fulfill({
            contentType: 'application/json',
            status: 503,
            body: JSON.stringify({ message: 'Notifications unavailable' }),
          })
          return
        }

        const filtered = notifications.filter((notification) => {
          const occurredAt = new Date(notification.occurredAt).getTime()
          const from = requestUrl.searchParams.get('occurredFrom')
          const to = requestUrl.searchParams.get('occurredTo')
          return (
            (from === null || occurredAt >= new Date(from).getTime()) &&
            (to === null || occurredAt <= new Date(to).getTime())
          )
        })
        const cursorId = requestUrl.searchParams.get('cursorId')
        const cursorIndex = cursorId
          ? filtered.findIndex((notification) => notification.id === cursorId)
          : -1
        const start = cursorIndex >= 0 ? cursorIndex + 1 : 0
        const limit = Number(requestUrl.searchParams.get('limit') ?? 20)
        const items = filtered.slice(start, start + limit)
        const lastItem = items.at(-1)
        const nextCursor =
          lastItem && start + items.length < filtered.length
            ? { occurredAt: lastItem.occurredAt, id: lastItem.id }
            : undefined
        const unreadCount = notifications.filter(
          (notification) => !notification.readAt,
        ).length

        await route.fulfill({
          contentType: 'application/json',
          status: 200,
          body: JSON.stringify({ items, nextCursor, unreadCount }),
        })
      })
    },
  }
}
