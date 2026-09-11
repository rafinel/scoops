import type { Page } from '@playwright/test'

import { expect, test } from '../playwright'
import {
  CommunicationModuleFixture,
  type NotificationJson,
} from '../fixtures/communication-module-fixture'
import { accountResponse } from '../fixtures/identity-data-fixtures'

const REALTIME_ACCOUNT_ID = '00000000-0000-4000-8000-000000000003'
const REALTIME_ESTABLISHMENT_ID = '00000000-0000-4000-8000-000000000004'
const DESKTOP_VIEWPORT = { width: 1560, height: 1020 } as const
const NARROW_VIEWPORT = { width: 390, height: 844 } as const

function addDiagnostics(page: Page) {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  return { consoleErrors, failedRequests }
}

const realtimeNotification: NotificationJson = {
  id: '00000000-0000-4000-8000-000000000001',
  sourceEventId: '00000000-0000-4000-8000-000000000002',
  establishmentId: REALTIME_ESTABLISHMENT_ID,
  recipientUserId: REALTIME_ACCOUNT_ID,
  kind: 'stock-below-ideal',
  title: 'Estoque abaixo do ideal',
  message: 'Morango está com 1.200 g disponíveis.',
  occurredAt: '2026-01-01T12:00:00.000Z',
  createdAt: '2026-01-01T12:00:00.000Z',
}

function createNotification(
  suffix: string,
  overrides: Partial<NotificationJson> = {},
): NotificationJson {
  return {
    ...realtimeNotification,
    id: `00000000-0000-4000-8000-000000000${suffix}`,
    sourceEventId: `00000000-0000-4000-8000-000000001${suffix}`,
    ...overrides,
  }
}

function streamBody(notifications: readonly NotificationJson[]) {
  return notifications
    .map(
      (notification) =>
        `event: notification.created\ndata: ${JSON.stringify({ version: 1, notification })}\n\n`,
    )
    .join('')
}

async function setupAuthenticatedRoute({
  identityFixture,
  notifications,
  page,
  viewport,
}: {
  identityFixture: {
    mockManagerAccount: () => Promise<void>
    mockManagerSession: () => Promise<void>
  }
  notifications: readonly NotificationJson[]
  page: Page
  viewport: { height: number; width: number }
}) {
  const diagnostics = addDiagnostics(page)
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await page.route('**/auth/session*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ...accountResponse({
          id: REALTIME_ACCOUNT_ID,
          establishmentId: REALTIME_ESTABLISHMENT_ID,
        }),
        session: {
          sessionId: 'manager-session-id',
          user: { id: REALTIME_ACCOUNT_ID, email: 'manager@example.com' },
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2099-01-01T00:30:00.000Z',
          absoluteExpiresAt: '2099-01-08T00:00:00.000Z',
        },
      }),
      status: 200,
    })
  })

  const communication = CommunicationModuleFixture(page)
  await communication.mockNotifications({ managerNotifications: [] })
  await page.route('**/notifications/stream', async (route) => {
    await route.fulfill({
      body: streamBody(notifications),
      contentType: 'text/event-stream',
      headers: {
        'access-control-allow-credentials': 'true',
        'access-control-allow-origin': 'http://localhost:4001',
        'cache-control': 'no-cache',
      },
      status: 200,
    })
  })

  await page.setViewportSize(viewport)
  await page.goto('/notifications')

  return { ...diagnostics, communication }
}

function expectCleanDiagnostics({
  consoleErrors,
  failedRequests,
}: {
  consoleErrors: string[]
  failedRequests: string[]
}) {
  expect(consoleErrors).toEqual([])
  expect(failedRequests).toEqual([])
}

async function expectToast(page: Page, notification: NotificationJson) {
  const toast = page.getByRole('status', { name: new RegExp(notification.title) })
  await expect(toast).toBeVisible()
  await expect(toast).toContainText(notification.message)
  return toast
}

async function settleToastAnimation(page: Page) {
  await page.waitForTimeout(500)
}

test.describe('Realtime notification toast route', () => {
  test('captures the stock-below-ideal toast and selected dropdown on desktop', async ({
    page,
    identityFixture,
  }) => {
    const notification = realtimeNotification
    const { communication, ...diagnostics } = await setupAuthenticatedRoute({
      identityFixture,
      notifications: [notification],
      page,
      viewport: DESKTOP_VIEWPORT,
    })

    const toast = await expectToast(page, notification)
    await expect(page.getByRole('button', { name: 'Fechar notificação' })).toBeVisible()
    expect(communication.readRequests).toHaveLength(0)
    await settleToastAnimation(page)
    await page.screenshot({
      path: 'test-results/communication/notification-toast-single-desktop.png',
      fullPage: false,
    })

    await toast.getByRole('button', { name: 'Abrir notificação' }).click()
    const dropdown = page.getByRole('dialog', { name: 'Notificações' })
    await expect(dropdown).toBeVisible()
    await expect(dropdown.getByText(notification.title, { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/notifications\?period=last-30-days$/)
    await settleToastAnimation(page)
    await page.screenshot({
      path: 'test-results/communication/notification-toast-selected-dropdown-desktop.png',
      fullPage: false,
    })

    await page.keyboard.press('Escape')
    expectCleanDiagnostics(diagnostics)
  })

  test('captures the toast and selected dropdown at the narrow viewport', async ({
    page,
    identityFixture,
  }) => {
    const notification = createNotification('005')
    const { communication, ...diagnostics } = await setupAuthenticatedRoute({
      identityFixture,
      notifications: [notification],
      page,
      viewport: NARROW_VIEWPORT,
    })

    const toast = await expectToast(page, notification)
    expect(communication.readRequests).toHaveLength(0)
    await settleToastAnimation(page)
    await page.screenshot({
      path: 'test-results/communication/notification-toast-narrow.png',
      fullPage: false,
    })

    await toast.getByRole('button', { name: 'Abrir notificação' }).click()
    await expect(page.getByRole('dialog', { name: 'Notificações' })).toBeVisible()
    await expect(page).toHaveURL(/\/notifications\?period=last-30-days$/)
    await settleToastAnimation(page)
    await page.screenshot({
      path: 'test-results/communication/notification-toast-dropdown-narrow.png',
      fullPage: false,
    })

    await page.keyboard.press('Escape')
    expectCleanDiagnostics(diagnostics)
  })

  for (const [label, viewport] of [
    ['desktop', DESKTOP_VIEWPORT],
    ['narrow', NARROW_VIEWPORT],
  ] as const) {
    test(`captures a keyboard-focused toast on ${label}`, async ({
      page,
      identityFixture,
    }) => {
      const notification = createNotification(label === 'desktop' ? '010' : '011')
      const diagnostics = await setupAuthenticatedRoute({
        identityFixture,
        notifications: [notification],
        page,
        viewport,
      })

      const toast = await expectToast(page, notification)
      const openButton = toast.getByRole('button', { name: 'Abrir notificação' })
      await openButton.focus()
      await expect(openButton).toBeFocused()
      expect(diagnostics.communication.readRequests).toHaveLength(0)
      await settleToastAnimation(page)
      await page.screenshot({
        path: `test-results/communication/notification-toast-keyboard-focus-${label}.png`,
        fullPage: false,
      })

      await page.keyboard.press('Escape')
      await expect(toast).not.toBeVisible()
      expectCleanDiagnostics(diagnostics)
    })
  }

  for (const [label, viewport] of [
    ['desktop', DESKTOP_VIEWPORT],
    ['narrow', NARROW_VIEWPORT],
  ] as const) {
    test(`captures the three-toast stack on ${label}`, async ({
      page,
      identityFixture,
    }) => {
      const notifications = [
        createNotification(label === 'desktop' ? '020' : '021', {
          title: 'Primeira notificação',
          message: 'A primeira notificação da sequência chegou.',
        }),
        createNotification(label === 'desktop' ? '022' : '023', {
          title: 'Segunda notificação',
          message: 'A segunda notificação da sequência chegou.',
        }),
        createNotification(label === 'desktop' ? '024' : '025', {
          title: 'Terceira notificação',
          message: 'A terceira notificação da sequência chegou.',
        }),
      ]
      const diagnostics = await setupAuthenticatedRoute({
        identityFixture,
        notifications,
        page,
        viewport,
      })

      for (const notification of notifications) await expectToast(page, notification)
      expect(await page.getByRole('status').allTextContents()).toEqual([
        expect.stringContaining('Terceira notificação'),
        expect.stringContaining('Segunda notificação'),
        expect.stringContaining('Primeira notificação'),
      ])
      expect(diagnostics.communication.readRequests).toHaveLength(0)
      await settleToastAnimation(page)
      await page.screenshot({
        path: `test-results/communication/notification-toast-stack-${label}.png`,
        fullPage: false,
      })
      expectCleanDiagnostics(diagnostics)
    })
  }

  for (const [label, viewport] of [
    ['desktop', DESKTOP_VIEWPORT],
    ['narrow', NARROW_VIEWPORT],
  ] as const) {
    test(`captures long-copy toast content on ${label}`, async ({
      page,
      identityFixture,
    }) => {
      const notification = createNotification(label === 'desktop' ? '030' : '031', {
        title: 'Estoque de morango congelado precisa de reposição antes do próximo turno',
        message:
          'A câmara fria está com pouco espaço útil e a equipe precisa revisar a quantidade disponível para manter os pedidos do dia.',
      })
      const diagnostics = await setupAuthenticatedRoute({
        identityFixture,
        notifications: [notification],
        page,
        viewport,
      })

      const toast = await expectToast(page, notification)
      await expect(toast).toHaveAccessibleName(
        `${notification.title}. ${notification.message}`,
      )
      expect(diagnostics.communication.readRequests).toHaveLength(0)
      await settleToastAnimation(page)
      await page.screenshot({
        path: `test-results/communication/notification-toast-long-copy-${label}.png`,
        fullPage: false,
      })
      expectCleanDiagnostics(diagnostics)
    })
  }

  for (const [label, viewport] of [
    ['desktop', DESKTOP_VIEWPORT],
    ['narrow', NARROW_VIEWPORT],
  ] as const) {
    test(`captures stock and identity semantic variants on ${label}`, async ({
      page,
      identityFixture,
    }) => {
      const notifications = [
        createNotification(label === 'desktop' ? '040' : '041', {
          kind: 'stock-zero',
          title: 'Estoque zerado',
          message: 'O estoque de chocolate está zerado.',
        }),
        createNotification(label === 'desktop' ? '042' : '043', {
          kind: 'user-promoted',
          title: 'Usuário promovido',
          message: 'Ana agora é gerente da sorveteria.',
        }),
        createNotification(label === 'desktop' ? '044' : '045', {
          kind: 'user-inactivated',
          title: 'Usuário inativado',
          message: 'O acesso de Pedro foi inativado.',
        }),
      ]
      const diagnostics = await setupAuthenticatedRoute({
        identityFixture,
        notifications,
        page,
        viewport,
      })

      const expectedIconClasses = ['text-danger', 'text-success', 'text-muted-foreground']
      for (const [index, notification] of notifications.entries()) {
        const toast = await expectToast(page, notification)
        await expect(toast.locator('span[aria-hidden="true"] svg')).toHaveClass(
          new RegExp(expectedIconClasses[index]),
        )
      }
      expect(diagnostics.communication.readRequests).toHaveLength(0)
      await settleToastAnimation(page)
      await page.screenshot({
        path: `test-results/communication/notification-toast-semantic-${label}.png`,
        fullPage: false,
      })
      expectCleanDiagnostics(diagnostics)
    })
  }
})
