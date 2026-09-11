import type { Page } from '@playwright/test'

import { expect, test } from '../playwright'
import {
  CommunicationModuleFixture,
  type NotificationJson,
} from '../fixtures/communication-module-fixture'

const now = new Date()
const daysAgo = (days: number) => {
  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

const notification = (
  index: number,
  kind: NotificationJson['kind'],
  title: string,
  occurredAt = daysAgo(index % 4),
): NotificationJson => ({
  id: `notification-${index}`,
  sourceEventId: `event-${index}`,
  establishmentId: 'establishment-1',
  recipientUserId: 'browser-manager-id',
  kind,
  title,
  message: `Mensagem da notificação ${index}.`,
  occurredAt,
  createdAt: occurredAt,
})

const MANAGER_NOTIFICATIONS: NotificationJson[] = [
  notification(1, 'stock-below-ideal', 'Estoque abaixo do ideal'),
  notification(2, 'stock-zero', 'Estoque zerado'),
  notification(3, 'user-added', 'Novo usuário adicionado'),
  notification(4, 'user-promoted', 'Usuário promovido'),
  notification(5, 'user-demoted', 'Usuário rebaixado'),
  notification(6, 'user-inactivated', 'Usuário inativado'),
  notification(7, 'user-reactivated', 'Usuário reativado'),
]

const PAGINATED_NOTIFICATIONS = Array.from({ length: 22 }, (_, index) =>
  notification(
    index + 1,
    index % 2 === 0 ? 'stock-below-ideal' : 'stock-zero',
    `Notificação paginada ${index + 1}`,
  ),
)

const SCREENSHOT_DIRECTORY = 'test-results/communication'

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

test.describe('Notification center route', () => {
  test('redirects anonymous users while preserving the requested period', async ({
    page,
  }) => {
    await page.goto('/notifications?period=last-7-days')
    await expect(page).toHaveURL(/\/login\?returnTo=/)
    expect(new URL(page.url()).searchParams.get('returnTo')).toContain(
      'period=last-7-days',
    )
  })

  test('renders the Manager center, maps periods and read batches, and restores focus', async ({
    page,
    identityFixture,
  }) => {
    const { consoleErrors, failedRequests } = addDiagnostics(page)
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const communication = CommunicationModuleFixture(page)
    await communication.mockNotifications({ managerNotifications: MANAGER_NOTIFICATIONS })

    await page.setViewportSize({ width: 1560, height: 1020 })
    await page.goto('/notifications')
    await expect(
      page.getByRole('heading', { name: 'Notificações', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByLabel('Todas as notificações').getByText('Estoque abaixo do ideal', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(page.getByRole('list', { name: /notificações de hoje/i })).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIRECTORY}/notification-center-page-populated.png`,
      fullPage: false,
    })
    await expect
      .poll(() =>
        communication.listRequests.some((url) => url.searchParams.get('limit') === '20'),
      )
      .toBe(true)
    const pageRequest = communication.listRequests.find(
      (url) => url.searchParams.get('limit') === '20',
    )
    expect(pageRequest?.searchParams.get('occurredFrom')).toBeTruthy()
    expect(pageRequest?.searchParams.get('occurredTo')).toBeTruthy()

    const bell = page.getByRole('button', { name: /Notificações,/ })
    await bell.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Notificações' })).toBeVisible()
    await expect(
      page
        .getByRole('dialog', { name: 'Notificações' })
        .getByText('Estoque abaixo do ideal', {
          exact: true,
        }),
    ).toBeVisible()
    await page
      .getByRole('dialog', { name: 'Notificações' })
      .getByRole('listitem')
      .first()
      .scrollIntoViewIfNeeded()
    await expect.poll(() => communication.readRequests.length).toBeGreaterThan(0)
    expect(communication.readRequests[0]?.ids.length).toBeLessThanOrEqual(50)
    await page.screenshot({
      path: `${SCREENSHOT_DIRECTORY}/notification-center-dropdown-populated.png`,
      fullPage: false,
    })
    await page.keyboard.press('Escape')
    await expect(bell).toBeFocused()

    await page.getByRole('combobox', { name: 'Filtrar por período' }).click()
    await page.getByRole('option', { name: 'Últimos 7 dias' }).click()
    await expect(page).toHaveURL(/period=last-7-days/)
    await expect
      .poll(() => communication.listRequests.at(-1)?.searchParams.get('occurredFrom'))
      .toBeTruthy()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).resolves.toBe(true)
    await page.screenshot({
      path: `${SCREENSHOT_DIRECTORY}/notification-center-populated-narrow.png`,
      fullPage: false,
    })
    await bell.focus()
    await page.keyboard.press('Enter')
    const narrowDropdown = page.getByRole('dialog', { name: 'Notificações' })
    await expect(narrowDropdown).toBeVisible()
    await expect(narrowDropdown.getByRole('list', { name: 'Notificações' })).toBeVisible()
    await expect(narrowDropdown.getByRole('heading', { name: 'HOJE' })).toHaveCount(0)
    const narrowDropdownBounds = await narrowDropdown.boundingBox()
    expect(narrowDropdownBounds).not.toBeNull()
    expect(narrowDropdownBounds?.x ?? -1).toBeGreaterThanOrEqual(0)
    expect(narrowDropdownBounds?.y ?? -1).toBeGreaterThanOrEqual(0)
    expect(
      (narrowDropdownBounds?.x ?? -1) + (narrowDropdownBounds?.width ?? 0),
    ).toBeLessThanOrEqual(390)
    expect(
      (narrowDropdownBounds?.y ?? -1) + (narrowDropdownBounds?.height ?? 0),
    ).toBeLessThanOrEqual(844)
    await expect(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).resolves.toBe(true)
    await page.screenshot({
      path: `${SCREENSHOT_DIRECTORY}/notification-center-dropdown-populated-narrow.png`,
      fullPage: false,
    })
    await page.keyboard.press('Escape')
    await expect(bell).toBeFocused()
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })

  test('supports Operator data and all four URL periods', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    const communication = CommunicationModuleFixture(page)
    await communication.mockNotifications({
      operatorNotifications: [
        notification(41, 'user-reactivated', 'Operador reativado', daysAgo(120)),
      ],
    })

    for (const period of [
      'last-7-days',
      'last-30-days',
      'last-90-days',
      'all',
    ] as const) {
      await page.goto(`/notifications?period=${period}`)
      await expect(
        page.getByRole('heading', { name: 'Notificações', exact: true }),
      ).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`period=${period}`))
    }

    await page.goto('/notifications?period=last-7-days')
    await expect(page.getByText('Nenhuma notificação neste período')).toBeVisible()
    await page.goto('/notifications?period=all')
    await expect(page.getByText('Operador reativado')).toBeVisible()
    const allRequest = communication.listRequests.at(-1)
    expect(allRequest?.searchParams.get('occurredFrom')).toBeNull()
    expect(allRequest?.searchParams.get('occurredTo')).toBeNull()
  })

  test('returns to the previous page instead of always navigating home', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const communication = CommunicationModuleFixture(page)
    await communication.mockNotifications({ managerNotifications: MANAGER_NOTIFICATIONS })

    await page.goto('/')
    await page.goto('/notifications')
    await page.getByRole('link', { name: 'Voltar para página anterior' }).click()

    await expect(page).toHaveURL(/\/$/)
  })

  test('loads the next cursor page and retries a next-page failure', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const communication = CommunicationModuleFixture(page)
    await communication.mockNotifications({
      managerNotifications: PAGINATED_NOTIFICATIONS,
    })

    await page.goto('/notifications?period=all')
    await expect(page.getByText('Notificação paginada 1', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Ver mais' }).click()
    await expect(page.getByText('Notificação paginada 22', { exact: true })).toBeVisible()
    await expect
      .poll(() =>
        communication.listRequests.some(
          (url) => url.searchParams.get('cursorId') === 'notification-20',
        ),
      )
      .toBe(true)
    const cursorRequest = communication.listRequests.find(
      (url) => url.searchParams.get('cursorId') === 'notification-20',
    )
    expect(cursorRequest?.searchParams.get('cursorId')).toBe('notification-20')
    expect(cursorRequest?.searchParams.get('cursorOccurredAt')).toBeTruthy()
  })

  test('exposes loading, empty, filtered-empty, first-error, and retry states', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const communication = CommunicationModuleFixture(page)
    await communication.mockNotifications({
      delayMs: 350,
      managerNotifications: MANAGER_NOTIFICATIONS,
    })

    await page.setViewportSize({ width: 1560, height: 1020 })
    const navigation = page.goto('/notifications', { waitUntil: 'commit' })
    await expect(
      page.getByRole('status', { name: 'Carregando notificações' }),
    ).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIRECTORY}/notification-center-loading.png`,
      fullPage: false,
    })
    await navigation
    await expect(page.getByText('Estoque abaixo do ideal')).toBeVisible()

    await page.goto('/notifications?period=last-7-days')
    await expect(page.getByText('Estoque abaixo do ideal')).toBeVisible()

    await page.unroute('**/notifications**')
    const emptyFixture = CommunicationModuleFixture(page)
    await emptyFixture.mockNotifications({ managerNotifications: [] })
    await page.goto('/notifications?period=all')
    await expect(page.getByText('Nenhuma notificação ainda')).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIRECTORY}/notification-center-empty.png`,
      fullPage: false,
    })

    await page.unroute('**/notifications**')
    const errorFixture = CommunicationModuleFixture(page)
    await errorFixture.mockNotifications({ managerNotifications: MANAGER_NOTIFICATIONS })
    errorFixture.failNextListRequest(2)
    await page.goto('/notifications?period=last-90-days')
    await expect(page.getByRole('alert')).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIRECTORY}/notification-center-error-retry.png`,
      fullPage: false,
    })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Estoque abaixo do ideal')).toBeVisible()
  })
})
