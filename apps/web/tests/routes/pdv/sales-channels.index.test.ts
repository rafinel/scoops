import type { Page } from '@playwright/test'

import type { IdentityModuleFixture } from '../../fixtures/identity-module-fixture'
import type { PdvRequestRecord } from '../../fixtures/pdv-module-fixture'
import { expect, test } from '../../playwright'

const DESKTOP = { height: 1050, width: 1481 }
const NARROW = { height: 1024, width: 768 }
const SCREENSHOT_DIR = 'test-results/pdv'
// The first browser navigation can wait for Vite's cold client compilation after
// the URL commits; keep the semantic heading assertion while allowing that startup.
const INITIAL_PAGE_READY_TIMEOUT_MS = 15_000
const EXPECTED_UNMOUNTED_WARNING =
  /Can't perform a React state update on a component that hasn't mounted yet/

function recordDiagnostics(page: Page) {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()} — ${request.failure()?.errorText ?? 'failed'}`)
  })
  return {
    consoleErrors,
    failedRequests,
    unexpectedConsoleErrors: (additionalExpected: readonly RegExp[] = []) =>
      consoleErrors.filter(
        (error) =>
          ![EXPECTED_UNMOUNTED_WARNING, ...additionalExpected].some((expected) =>
            expected.test(error),
          ),
      ),
  }
}

async function startManager(
  page: Page,
  identityFixture: IdentityModuleFixture,
  viewport: { width: number; height: number },
) {
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await page.setViewportSize(viewport)
}

async function waitForRequest(
  requests: readonly PdvRequestRecord[],
  predicate: (request: PdvRequestRecord) => boolean,
) {
  await expect.poll(() => requests.some(predicate), { timeout: 10_000 }).toBe(true)
}

test.describe('Sales channel management route', () => {
  for (const viewport of [DESKTOP, NARROW]) {
    test(`filters the list by adjustment type at ${viewport.width}px and toggles back to all channels`, async ({
      page,
      identityFixture,
      pdvFixture,
    }) => {
      const diagnostics = recordDiagnostics(page)
      await startManager(page, identityFixture, viewport)
      await pdvFixture.mockSalesChannels()
      await page.goto('/sales-channels?adjustment=discount')

      function channelResult(name: string) {
        return viewport.width < 1024
          ? page.locator('article').filter({ hasText: name })
          : page.getByRole('row', { name: new RegExp(name) })
      }

      const discountFilter = page.getByRole('button', { name: 'Filtrar descontos' })
      await expect(discountFilter).toHaveAttribute('aria-pressed', 'true')
      await expect(page).toHaveURL(/\/sales-channels\?adjustment=discount$/)
      await expect(channelResult('Promoção local')).toBeVisible()
      await expect(channelResult('Delivery próprio')).toHaveCount(0)

      const increaseFilter = page.getByRole('button', { name: 'Filtrar acréscimos' })
      await increaseFilter.focus()
      await expect(increaseFilter).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(increaseFilter).toHaveAttribute('aria-pressed', 'true')
      await expect(page).toHaveURL(/\/sales-channels\?adjustment=increase$/)
      await expect(channelResult('Delivery próprio')).toBeVisible()
      await expect(channelResult('iFood')).toBeVisible()
      await expect(channelResult('Balcão')).toHaveCount(0)
      await expect(channelResult('Promoção local')).toHaveCount(0)
      await expect(page.getByText('2 de 4 canais · 2 ativos · 0 inativos')).toBeVisible()
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/vis-11-adjustment-filter-${viewport.width}x${viewport.height}.png`,
      })

      await page.keyboard.press('Enter')
      await expect(increaseFilter).toHaveAttribute('aria-pressed', 'false')
      await expect(page).toHaveURL(/\/sales-channels$/)
      await expect(channelResult('Balcão')).toBeVisible()
      await expect(channelResult('Promoção local')).toBeVisible()
      expect(diagnostics.unexpectedConsoleErrors()).toEqual([])
      expect(diagnostics.failedRequests).toEqual([])
    })
  }

  test('falls back to all channels for an invalid adjustment search value', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const diagnostics = recordDiagnostics(page)
    await startManager(page, identityFixture, DESKTOP)
    await pdvFixture.mockSalesChannels()
    await page.goto('/sales-channels?adjustment=invalid')

    await expect(
      page.getByRole('button', { name: 'Filtrar acréscimos' }),
    ).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('row', { name: /Delivery próprio/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /Promoção local/ })).toBeVisible()
    expect(diagnostics.unexpectedConsoleErrors()).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
  })

  test('renders the Manager desktop list and completes the lifecycle contract', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const diagnostics = recordDiagnostics(page)
    await startManager(page, identityFixture, DESKTOP)
    const pdv = await pdvFixture.mockSalesChannels()

    await page.goto('/sales-channels')
    await expect(page).toHaveURL(/\/sales-channels$/)
    await expect(page.getByRole('heading', { name: 'Canais de venda' })).toBeVisible({
      timeout: INITIAL_PAGE_READY_TIMEOUT_MS,
    })
    await expect(page.getByRole('link', { name: 'Canais de venda' })).toBeVisible()
    await expect(page.getByRole('row', { name: /Delivery próprio/ })).toBeVisible()
    await page.getByRole('button', { name: 'Novo canal' }).focus()
    await expect(page.getByRole('button', { name: 'Novo canal' })).toBeFocused()
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/vis-01-sales-channels-1481x1050.png`,
    })

    const deliveryRow = () => page.getByRole('row', { name: /Delivery próprio/ })
    await deliveryRow()
      .getByRole('button', { name: 'Abrir ações de Delivery próprio' })
      .click()
    const activeMenu = page.getByRole('menu')
    await expect(activeMenu.getByRole('menuitem', { name: 'Editar canal' })).toBeVisible()
    await expect(
      activeMenu.getByRole('menuitem', { name: 'Inativar canal' }),
    ).toBeVisible()
    await expect(
      activeMenu.getByRole('menuitem', { name: 'Excluir canal' }),
    ).toBeVisible()
    await activeMenu.screenshot({
      path: `${SCREENSHOT_DIR}/vis-04-channel-actions-menu.png`,
    })
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Novo canal' }).click()
    const createDialog = page.getByRole('dialog', { name: 'Novo canal' })
    await expect(createDialog).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/vis-02-create-dialog-1481x1050.png`,
    })
    await createDialog.screenshot({
      path: `${SCREENSHOT_DIR}/vis-02-create-channel-dialog.png`,
    })
    await createDialog
      .getByRole('textbox', { name: 'Nome do canal' })
      .fill('Delivery teste')
    await createDialog
      .getByRole('textbox', { name: 'Percentual de ajuste' })
      .fill('12,00')
    await createDialog.getByRole('button', { name: 'Criar canal' }).click()
    await waitForRequest(
      pdv.requests,
      (request) =>
        request.method === 'POST' &&
        request.url.pathname === '/sales-channels' &&
        JSON.stringify(request.body) ===
          JSON.stringify({ name: 'Delivery teste', percentage: 12, status: 'active' }),
    )
    await expect(page.getByText('Delivery teste').first()).toBeVisible()

    await deliveryRow()
      .getByRole('button', { name: 'Abrir ações de Delivery próprio' })
      .click()
    await page.getByRole('menuitem', { name: 'Editar canal' }).click()
    const editDialog = page.getByRole('dialog', { name: 'Editar canal' })
    await expect(editDialog).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/vis-03-edit-dialog-1481x1050.png` })
    await editDialog.screenshot({
      path: `${SCREENSHOT_DIR}/vis-03-edit-channel-dialog.png`,
    })
    await editDialog
      .getByRole('textbox', { name: 'Nome do canal' })
      .fill('Delivery ajustado')
    await editDialog.getByRole('textbox', { name: 'Percentual de ajuste' }).fill('-5,00')
    await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()
    await waitForRequest(
      pdv.requests,
      (request) =>
        request.method === 'PATCH' &&
        request.url.pathname === '/sales-channels/channel-delivery' &&
        JSON.stringify(request.body) ===
          JSON.stringify({ name: 'Delivery ajustado', percentage: -5 }),
    )
    await expect(page.getByText('Delivery ajustado').first()).toBeVisible()

    const adjustedRow = () => page.getByRole('row', { name: /Delivery ajustado/ })
    await adjustedRow()
      .getByRole('button', { name: 'Abrir ações de Delivery ajustado' })
      .click()
    await page.getByRole('menuitem', { name: 'Inativar canal' }).click()
    const inactivateDialog = page.getByRole('alertdialog', { name: 'Inativar canal?' })
    await expect(inactivateDialog).toBeVisible()
    await expect(inactivateDialog).toContainText('continuarão no histórico')
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/vis-05-inactivate-dialog-1481x1050.png`,
    })
    await inactivateDialog.screenshot({
      path: `${SCREENSHOT_DIR}/vis-05-deactivate-channel-dialog.png`,
    })
    await inactivateDialog.getByRole('button', { name: 'Inativar canal' }).click()
    await waitForRequest(
      pdv.requests,
      (request) =>
        request.method === 'PATCH' &&
        request.url.pathname === '/sales-channels/channel-delivery/inactivate',
    )
    await expect(adjustedRow()).toContainText('Inativo')

    await adjustedRow()
      .getByRole('button', { name: 'Abrir ações de Delivery ajustado' })
      .click()
    const inactiveMenu = page.getByRole('menu')
    await expect(
      inactiveMenu.getByRole('menuitem', { name: 'Reativar canal' }),
    ).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/vis-09-inactive-row-reactivate-1481x1050.png`,
    })
    await inactiveMenu.getByRole('menuitem', { name: 'Reativar canal' }).click()
    await waitForRequest(
      pdv.requests,
      (request) =>
        request.method === 'PATCH' &&
        request.url.pathname === '/sales-channels/channel-delivery/reactivate',
    )
    await expect(adjustedRow()).toContainText('Ativo')

    await adjustedRow()
      .getByRole('button', { name: 'Abrir ações de Delivery ajustado' })
      .click()
    await page.getByRole('menuitem', { name: 'Excluir canal' }).click()
    const deleteDialog = page.getByRole('alertdialog', { name: 'Excluir canal?' })
    await expect(deleteDialog).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/vis-06-delete-dialog-1481x1050.png`,
    })
    await deleteDialog.screenshot({
      path: `${SCREENSHOT_DIR}/vis-06-delete-channel-dialog.png`,
    })
    await deleteDialog.getByRole('button', { name: 'Excluir canal' }).click()
    await waitForRequest(
      pdv.requests,
      (request) =>
        request.method === 'DELETE' &&
        request.url.pathname === '/sales-channels/channel-delivery',
    )
    await expect(page.getByText('Delivery ajustado')).toHaveCount(0)
    expect(diagnostics.unexpectedConsoleErrors()).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
  })

  test('renders narrow cards, menu actions and keeps the content within 768px', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const diagnostics = recordDiagnostics(page)
    await startManager(page, identityFixture, NARROW)
    await pdvFixture.mockSalesChannels()
    await page.goto('/sales-channels')
    const card = page.locator('article').filter({ hasText: 'Delivery próprio' }).first()
    await expect(card).toBeVisible()
    await expect(
      card.getByRole('button', { name: 'Abrir ações de Delivery próprio' }),
    ).toHaveCSS('width', '44px')
    await card.getByRole('button', { name: 'Abrir ações de Delivery próprio' }).focus()
    await expect(
      card.getByRole('button', { name: 'Abrir ações de Delivery próprio' }),
    ).toBeFocused()
    await card.getByRole('button', { name: 'Abrir ações de Delivery próprio' }).click()
    await expect(page.getByRole('menuitem', { name: 'Inativar canal' })).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/vis-07-sales-channels-768x1024.png`,
    })
    await page.keyboard.press('Escape')
    const inactiveCard = page.locator('article').filter({ hasText: 'Promoção local' })
    await inactiveCard
      .getByRole('button', { name: 'Abrir ações de Promoção local' })
      .click()
    await expect(page.getByRole('menuitem', { name: 'Reativar canal' })).toBeVisible()
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/vis-09-inactive-row-reactivate-768x1024.png`,
    })
    await page.keyboard.press('Escape')
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
    expect(diagnostics.unexpectedConsoleErrors()).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
  })

  test('renders empty states at desktop and narrow viewports', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const diagnostics = recordDiagnostics(page)
    await startManager(page, identityFixture, DESKTOP)
    await pdvFixture.mockSalesChannels({ channels: [] })
    await page.goto('/sales-channels')
    await expect(
      page.getByRole('heading', { name: 'Nenhum canal cadastrado' }),
    ).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/vis-08-empty-1481x1050.png` })
    await page.setViewportSize(NARROW)
    await expect(
      page.getByRole('heading', { name: 'Nenhum canal cadastrado' }),
    ).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/vis-08-empty-768x1024.png` })
    expect(diagnostics.unexpectedConsoleErrors()).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
  })

  test('renders Portuguese validation messages for channel fields', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const diagnostics = recordDiagnostics(page)
    await startManager(page, identityFixture, DESKTOP)
    const pdv = await pdvFixture.mockSalesChannels({ channels: [] })
    await page.goto('/sales-channels')
    await page
      .getByRole('main')
      .locator('header')
      .getByRole('button', { name: 'Novo canal' })
      .click()

    const dialog = page.getByRole('dialog', { name: 'Novo canal' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('textbox', { name: 'Nome do canal' }).fill('')
    await dialog.getByRole('button', { name: 'Criar canal' }).click()
    await expect(dialog).toContainText('Informe um nome.')

    await dialog.getByRole('textbox', { name: 'Percentual de ajuste' }).fill('101')
    await dialog.getByRole('button', { name: 'Criar canal' }).click()
    await expect(dialog).toContainText(
      'Informe uma porcentagem válida, com até duas casas decimais.',
    )
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/vis-10-validation-error-1481x1050.png`,
    })
    expect(pdv.requests.filter((request) => request.method === 'POST')).toHaveLength(0)
    expect(diagnostics.unexpectedConsoleErrors()).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
  })

  for (const viewport of [DESKTOP, NARROW]) {
    test(`renders the delayed loading state at ${viewport.width}px`, async ({
      page,
      identityFixture,
      pdvFixture,
    }) => {
      const diagnostics = recordDiagnostics(page)
      await startManager(page, identityFixture, viewport)
      let release!: () => void
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      const pdv = await pdvFixture.mockSalesChannels({
        respond: async () => {
          await gate
          return { body: [] }
        },
      })
      await page.goto('/sales-channels', { waitUntil: 'commit' })
      await expect
        .poll(() => pdv.requests.filter((request) => request.method === 'GET').length, {
          timeout: 15_000,
        })
        .toBe(1)
      await expect(
        page.getByRole('status', { name: 'Carregando canais de venda' }),
      ).toBeVisible()
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/vis-08-loading-${viewport.width}x${viewport.height}.png`,
      })
      release()
      await expect(
        page.getByRole('heading', { name: 'Nenhum canal cadastrado' }),
      ).toBeVisible()
      expect(diagnostics.unexpectedConsoleErrors()).toEqual([])
      expect(diagnostics.failedRequests).toEqual([])
    })
  }

  for (const viewport of [DESKTOP, NARROW]) {
    test(`recovers from a list error at ${viewport.width}px`, async ({
      page,
      identityFixture,
      pdvFixture,
    }) => {
      const diagnostics = recordDiagnostics(page)
      await startManager(page, identityFixture, viewport)
      const pdv = await pdvFixture.mockSalesChannels({
        respond: (_request, requestNumber) =>
          requestNumber === 1
            ? { body: { message: 'temporary failure' }, status: 503 }
            : undefined,
      })
      await page.goto('/sales-channels')
      await expect(page.getByText('Não foi possível carregar os canais')).toBeVisible()
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/vis-08-error-${viewport.width}x${viewport.height}.png`,
      })
      await page.getByRole('button', { name: 'Tentar novamente' }).click()
      const recoveredChannel =
        viewport.width < 1024
          ? page.locator('article').filter({ hasText: 'Delivery próprio' })
          : page.getByRole('row', { name: /Delivery próprio/ })
      await expect(recoveredChannel).toBeVisible()
      expect(pdv.requests.filter((request) => request.method === 'GET')).toHaveLength(2)
      expect(diagnostics.unexpectedConsoleErrors([/status of 503/])).toEqual([])
      expect(diagnostics.failedRequests).toEqual([])
    })
  }

  test('denies Operator management access and removes the management navigation item', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const diagnostics = recordDiagnostics(page)
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    const pdv = await pdvFixture.mockSalesChannels()
    await page.goto('/sales-channels')
    await expect(page).toHaveURL(/\/access-denied$/)
    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
    expect(page.getByRole('link', { name: 'Canais de venda' })).toHaveCount(0)
    expect(pdv.requests).toHaveLength(0)
    expect(diagnostics.unexpectedConsoleErrors()).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
  })

  test('redirects anonymous direct access to login with a safe return path', async ({
    page,
  }) => {
    await page.goto('/sales-channels')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fsales-channels/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
  })
})
