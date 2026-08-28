import type { Page } from '@playwright/test'

import { expect, test } from '../../playwright'
import type { IdentityModuleFixture } from '../../fixtures/identity-module-fixture'
import type { PdvFixture } from '../../fixtures/pdv-module-fixture'

const PRODUCT_ID = 'product-portion'
const SIZE_ID = 'size-medium'
const INITIAL_PAGE_READY_TIMEOUT_MS = 15_000

const product = {
  productId: PRODUCT_ID,
  name: 'Taça de morango',
  kind: 'portion',
  stockControl: 'single',
  isActive: true,
  isAvailable: true,
  sizes: [
    {
      sizeId: SIZE_ID,
      name: 'Médio',
      quantity: 2,
      basePrice: 20,
      isActive: true,
      isAvailable: true,
      accompaniments: [],
    },
  ],
  resaleBrands: [],
}

const previewCart = {
  establishmentId: 'establishment-1',
  lines: [
    {
      accompanimentIds: [],
      kind: 'portion',
      productId: PRODUCT_ID,
      quantity: 1,
      sizeId: SIZE_ID,
      baseUnitPrice: 20,
      finalUnitPrice: 20,
      subtotal: 20,
      consumptions: [],
    },
  ],
  discounts: [],
  subtotal: 20,
  totalDiscount: 0,
  total: 20,
}

const resaleProduct = {
  productId: 'product-resale',
  name: 'Pote pronto',
  kind: 'resale',
  stockControl: 'by-brand',
  isActive: true,
  isAvailable: true,
  sizes: [],
  resaleBrands: [
    {
      brandId: 'brand-1',
      name: 'Marca Frooty',
      basePrice: 15,
      isActive: true,
      isAvailable: true,
    },
  ],
}

test.describe('New Sale route', () => {
  for (const viewport of [
    { height: 1050, width: 1481, name: 'desktop' },
    { height: 844, width: 390, name: 'narrow' },
  ]) {
    test(`renders the catalog and preserves the preview request at ${viewport.name} viewport`, async ({
      page,
      identityFixture,
      pdvFixture,
    }) => {
      const consoleErrors: string[] = []
      const failedRequests: string[] = []
      const requests: { body: unknown; method: string; path: string }[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('requestfailed', (request) => {
        failedRequests.push(request.url())
      })

      await identityFixture.mockManagerSession()
      await identityFixture.mockManagerAccount()
      await pdvFixture.mockSalesChannels()
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.route('**/orders/catalog*', async (route) => {
        requests.push({
          body: undefined,
          method: route.request().method(),
          path: new URL(route.request().url()).pathname,
        })
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            items: [product],
            page: 1,
            pageSize: 20,
            total: 1,
            totalPages: 1,
          }),
          status: 200,
        })
      })
      await page.route('**/orders/preview*', async (route) => {
        requests.push({
          body: route.request().postDataJSON(),
          method: route.request().method(),
          path: new URL(route.request().url()).pathname,
        })
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ cart: previewCart, previewToken: 'preview-token' }),
          status: 200,
        })
      })

      await page.goto('/sales/new')
      await expect(page).toHaveURL(/\/sales\/new$/)
      await expect(page.getByRole('heading', { name: 'Nova venda' })).toBeVisible({
        timeout: INITIAL_PAGE_READY_TIMEOUT_MS,
      })
      const addButton = page.getByRole('button', {
        name: 'Adicionar Taça de morango',
      })
      await expect(addButton).toBeVisible()
      await addButton.focus()
      await expect(addButton).toBeFocused()

      await addButton.click()
      const dialog = page.getByRole('dialog', { name: 'Taça de morango' })
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Adicionar ao carrinho' }).click()
      await expect(page.getByText('Taça de morango').last()).toBeVisible()
      await expect
        .poll(() =>
          requests.some(
            (request) =>
              request.method === 'POST' &&
              request.path === '/orders/preview' &&
              JSON.stringify(request.body) ===
                JSON.stringify({
                  lines: [
                    {
                      accompanimentIds: [],
                      kind: 'portion',
                      productId: PRODUCT_ID,
                      quantity: 1,
                      sizeId: SIZE_ID,
                    },
                  ],
                }),
          ),
        )
        .toBe(true)
      await expect(page.getByText('R$ 20,00').last()).toBeVisible()
      await page.screenshot({
        path: `test-results/pdv/new-sale-${viewport.name}-${viewport.width}x${viewport.height}.png`,
      })

      expect(
        requests.some(
          (request) => request.method === 'GET' && request.path === '/orders/catalog',
        ),
      ).toBe(true)
      expect(consoleErrors).toEqual([])
      expect(failedRequests).toEqual([])
    })
  }

  test('restores the in-progress cart after reloading the sale route', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    await prepareSale(
      page,
      identityFixture,
      pdvFixture,
      { width: 1481, height: 1050 },
      undefined,
      false,
    )

    await page.getByRole('button', { name: 'Adicionar Taça de morango' }).click()
    await page
      .getByRole('dialog', { name: 'Taça de morango' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click()
    await expect(page.getByRole('button', { name: 'Registrar pedido' })).toBeEnabled({
      timeout: INITIAL_PAGE_READY_TIMEOUT_MS,
    })
    await page.reload()
    await expect(page.getByRole('button', { name: 'Registrar pedido' })).toBeEnabled({
      timeout: INITIAL_PAGE_READY_TIMEOUT_MS,
    })
    await expect(page.getByText('Taça de morango').last()).toBeVisible()
  })

  test('shows product card skeletons while the catalog loads', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await pdvFixture.mockSalesChannels()
    await page.setViewportSize({ width: 1106, height: 575 })
    await page.route('**/orders/catalog*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10000))
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          items: [product],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        }),
        status: 200,
      })
    })

    await page.goto('/sales/new', { waitUntil: 'commit' })
    await expect(page.getByRole('heading', { name: 'Nova venda' })).toBeVisible({
      timeout: INITIAL_PAGE_READY_TIMEOUT_MS,
    })
    const loadingState = page.getByRole('status', { name: 'Carregando produtos' })
    await expect(loadingState).toBeVisible()
    await expect(loadingState.locator(':scope > *')).toHaveCount(4)
    await page.screenshot({ path: 'test-results/pdv/new-sale-catalog-loading-1106x575.png' })
    await expect(loadingState).toBeHidden({ timeout: INITIAL_PAGE_READY_TIMEOUT_MS })
  })

  test('redirects an anonymous visitor to login', async ({ page }) => {
    await page.goto('/sales/new')
    await expect(page).toHaveURL(/\/login/, { timeout: INITIAL_PAGE_READY_TIMEOUT_MS })
  })

  test('captures the portion and resale configuration states at their reference viewports', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const consoleErrors: string[] = []
    const failedRequests: string[] = []
    const responseDiagnostics: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => failedRequests.push(request.url()))
    page.on('response', (response) => {
      if (response.status() >= 400) {
        responseDiagnostics.push(`${response.status()} ${response.url()}`)
      }
    })

    await prepareSale(
      page,
      identityFixture,
      pdvFixture,
      { width: 756, height: 966 },
      undefined,
      false,
    )
    const portionAddButton = page.getByRole('button', {
      name: 'Adicionar Taça de morango',
    })
    await portionAddButton.focus()
    await expect(portionAddButton).toBeFocused()
    await portionAddButton.press('Enter')
    const portionDialog = page.getByRole('dialog', { name: 'Taça de morango' })
    await expect(portionDialog).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(1)
    const portionSizeButton = portionDialog.getByRole('button', { name: /Médio/ })
    await portionSizeButton.focus()
    await expect(portionSizeButton).toBeFocused()
    await page.screenshot({
      path: 'test-results/pdv/new-sale-portion-dialog-756x966.png',
    })
    const portionCancelButton = portionDialog.getByRole('button', { name: 'Cancelar' })
    await portionCancelButton.focus()
    await expect(portionCancelButton).toBeFocused()
    await portionCancelButton.press('Enter')
    await expect(portionDialog).toBeHidden()

    await page.setViewportSize({ width: 756, height: 866 })
    const resaleAddButton = page.getByRole('button', {
      name: 'Adicionar Pote pronto',
    })
    await resaleAddButton.focus()
    await expect(resaleAddButton).toBeFocused()
    await resaleAddButton.press('Enter')
    const resaleDialog = page.getByRole('dialog', { name: 'Pote pronto' })
    await expect(resaleDialog).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(1)
    const brandButton = resaleDialog.getByRole('button', { name: /Marca Frooty/ })
    await brandButton.focus()
    await expect(brandButton).toBeFocused()
    await page.screenshot({
      path: 'test-results/pdv/new-sale-resale-dialog-756x866.png',
    })
    const resaleCancelButton = resaleDialog.getByRole('button', { name: 'Cancelar' })
    await resaleCancelButton.focus()
    await expect(resaleCancelButton).toBeFocused()
    await resaleCancelButton.press('Enter')
    await expect(resaleDialog).toBeHidden()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
    expect(responseDiagnostics).toEqual([])
  })

  test('captures the registered-order confirmation at the desktop reference viewport', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const consoleErrors: string[] = []
    const failedRequests: string[] = []
    const failedResponses: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => failedRequests.push(request.url()))
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`)
      }
    })

    await prepareSale(
      page,
      identityFixture,
      pdvFixture,
      { width: 1481, height: 1050 },
      {
        body: {
          kind: 'registered',
          order: {
            id: 'order-registered-1',
            establishmentId: 'establishment-1',
            idempotencyKey: 'registration-key-1',
            sequenceNumber: 42,
            createdBy: 'manager-1',
            channel: {
              channelId: 'channel-balcao',
              name: 'Balcão',
              percentage: 0,
            },
            lines: [
              {
                product: {
                  productId: PRODUCT_ID,
                  name: 'Taça de morango',
                  kind: 'portion',
                },
                size: { sizeId: SIZE_ID, name: 'Médio', quantity: 2 },
                brand: undefined,
                accompaniments: [],
                quantity: 1,
                baseUnitPrice: 20,
                finalUnitPrice: 20,
                subtotal: 20,
                consumptions: [],
              },
            ],
            discounts: [],
            subtotal: 20,
            totalDiscount: 0,
            total: 20,
            createdAt: '2026-08-27T12:00:00.000Z',
          },
          replayed: false,
        },
        heading: 'Pedido registrado',
        name: 'registered',
        status: 201,
        viewport: { width: 1481, height: 1050 },
      },
    )
    const registerButton = page.getByRole('button', { name: 'Registrar pedido' })
    await registerButton.focus()
    await expect(registerButton).toBeFocused()
    await registerButton.press('Enter')
    const confirmationDialog = page.getByRole('dialog', { name: 'Confirmar pedido' })
    await expect(confirmationDialog).toBeVisible()
    const confirmButton = confirmationDialog.getByRole('button', {
      name: 'Confirmar registro',
    })
    await confirmButton.focus()
    await expect(confirmButton).toBeFocused()
    await confirmButton.press('Enter')

    await expect(page.getByRole('heading', { name: 'Pedido registrado' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Confirmar pedido' })).toHaveCount(0)
    await expect(page.getByText('#0042')).toBeVisible()
    await expect(page.getByText('Taça de morango')).toBeVisible()
    await expect(page.getByText('R$ 20,00').last()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar nova venda' })).toBeVisible()
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
    expect(failedResponses).toEqual([])
    await page.screenshot({
      path: 'test-results/pdv/new-sale-registered-1481x1050.png',
    })
  })

  for (const outcome of [
    {
      body: {
        kind: 'repriced',
        recalculatedCart: previewCart,
        previewToken: 'fresh-preview-token',
        changes: [
          {
            kind: 'channel',
            previous: { label: 'Canal anterior', amount: 20 },
            current: { label: 'Canal atual', amount: 22 },
          },
        ],
      },
      heading: 'O pedido foi atualizado',
      name: 'repriced',
      status: 200,
      actionName: 'Revisar valores',
      viewport: { width: 717, height: 546 },
    },
    {
      body: {
        kind: 'review-required',
        shortages: [
          {
            productId: PRODUCT_ID,
            productName: 'Taça de morango',
            requiredQuantity: 2,
            availableQuantity: 1,
            unit: 'un.',
          },
        ],
        changes: [],
      },
      heading: 'Revise o pedido',
      name: 'review-required',
      status: 409,
      actionName: 'Revisar pedido',
      viewport: { width: 717, height: 547 },
    },
    {
      body: {
        kind: 'correction-required',
        invalidConfigurations: [
          {
            productId: PRODUCT_ID,
            productName: 'Taça de morango',
            selectedKind: 'portion',
            selectedId: SIZE_ID,
            reason: 'unavailable',
            correctiveMessage: 'Escolha um tamanho disponível.',
          },
        ],
        shortages: [],
        changes: [],
      },
      heading: 'Corrija o pedido',
      name: 'correction-required',
      status: 409,
      actionName: 'Revisar itens',
      viewport: { width: 717, height: 564 },
    },
    {
      body: { message: 'Registro revertido com segurança.' },
      heading: 'Não foi possível registrar',
      name: 'rollback',
      status: 503,
      actionName: 'Voltar ao pedido',
      viewport: { width: 717, height: 420 },
    },
  ] as const) {
    test(`captures the ${outcome.name} registration state`, async ({
      page,
      identityFixture,
      pdvFixture,
    }) => {
      const consoleErrors: string[] = []
      const failedRequests: string[] = []
      const responseDiagnostics: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('requestfailed', (request) => failedRequests.push(request.url()))
      page.on('response', (response) => {
        if (response.status() >= 400) {
          responseDiagnostics.push(`${response.status()} ${response.url()}`)
        }
      })

      await page.setViewportSize(outcome.viewport)
      await prepareSale(page, identityFixture, pdvFixture, undefined, outcome)
      const registerButton = page.getByRole('button', { name: 'Registrar pedido' })
      await registerButton.focus()
      await expect(registerButton).toBeFocused()
      await registerButton.press('Enter')
      const confirmationDialog = page.getByRole('dialog', { name: 'Confirmar pedido' })
      await expect(confirmationDialog).toBeVisible()
      const confirmButton = confirmationDialog.getByRole('button', {
        name: 'Confirmar registro',
      })
      await confirmButton.focus()
      await expect(confirmButton).toBeFocused()
      await confirmButton.press('Enter')
      const outcomeDialog = page.getByRole('dialog', { name: outcome.heading })
      await expect(outcomeDialog).toBeVisible()
      await expect(confirmationDialog).toBeHidden()
      await expect(page.getByRole('dialog')).toHaveCount(1)
      const actionButton = outcomeDialog.getByRole('button', {
        name: outcome.actionName,
      })
      await expect(actionButton).toBeVisible()
      await actionButton.focus()
      await expect(actionButton).toBeFocused()
      if (outcome.status >= 400) {
        expect(consoleErrors).toHaveLength(1)
        expect(consoleErrors[0]).toContain(`status of ${outcome.status}`)
        expect(responseDiagnostics).toHaveLength(1)
        expect(responseDiagnostics[0]).toContain(`${outcome.status} `)
        expect(responseDiagnostics[0]).toContain('/orders')
      } else {
        expect(consoleErrors).toEqual([])
        expect(responseDiagnostics).toEqual([])
      }
      expect(failedRequests).toEqual([])
      await page.waitForTimeout(500)
      await page.screenshot({
        path: `test-results/pdv/new-sale-${outcome.name}-${outcome.viewport.width}x${outcome.viewport.height}.png`,
      })
    })
  }

  for (const viewport of [
    { width: 717, height: 420, name: 'desktop' },
    { width: 390, height: 844, name: 'narrow' },
  ]) {
    test(`captures neutral verification at ${viewport.name} viewport`, async ({
      page,
      identityFixture,
      pdvFixture,
    }) => {
      let registerCount = 0
      let releaseReplay: (() => void) | undefined
      const registrationRequests: unknown[] = []
      const consoleErrors: string[] = []
      const failedRequests: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('requestfailed', (request) => failedRequests.push(request.url()))
      await page.route('**/orders', async (route) => {
        registerCount += 1
        registrationRequests.push(route.request().postDataJSON())
        if (registerCount === 1) {
          await route.abort()
          return
        }
        await new Promise<void>((resolve) => {
          releaseReplay = resolve
        })
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Ainda não resolvido' }),
          status: 503,
        })
      })
      await prepareSale(page, identityFixture, pdvFixture, viewport)
      await page.getByRole('button', { name: 'Registrar pedido' }).click()
      await page
        .getByRole('dialog', { name: 'Confirmar pedido' })
        .getByRole('button', { name: 'Confirmar registro' })
        .click()
      await expect(
        page.getByRole('status', { name: 'Verificando registro' }),
      ).toBeVisible({
        timeout: INITIAL_PAGE_READY_TIMEOUT_MS,
      })
      await expect(page.getByRole('dialog', { name: 'Confirmar pedido' })).toHaveCount(0)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.getByRole('status', { name: 'Verificando registro' })).toBeFocused()
      await expect.poll(() => registrationRequests.length).toBe(2)
      expect(registrationRequests[0]).toEqual(registrationRequests[1])
      expect(registrationRequests[0]).toMatchObject({
        idempotencyKey: expect.any(String),
        previewToken: 'preview-token',
      })
      expect(consoleErrors).toHaveLength(1)
      expect(consoleErrors[0]).toContain('ERR_FAILED')
      expect(consoleErrors.filter((error) => !error.includes('ERR_FAILED'))).toEqual([])
      expect(failedRequests).toHaveLength(1)
      expect(failedRequests[0]).toContain('/orders')
      await page.screenshot({
        path: `test-results/pdv/new-sale-neutral-verification-${viewport.name}-${viewport.width}x${viewport.height}.png`,
      })
      releaseReplay?.()
    })
  }
})

type RegistrationMock = {
  actionName?: string
  body: unknown
  heading: string
  name: string
  status: number
  viewport: { width: number; height: number }
}

async function prepareSale(
  page: Page,
  identityFixture: IdentityModuleFixture,
  pdvFixture: PdvFixture,
  viewport?: { width: number; height: number },
  registration?: RegistrationMock,
  addToCart = true,
) {
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await pdvFixture.mockSalesChannels()
  if (viewport) await page.setViewportSize(viewport)
  await page.route('**/orders/catalog*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: [product, resaleProduct],
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      }),
      status: 200,
    })
  })
  await page.route('**/orders/preview*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ cart: previewCart, previewToken: 'preview-token' }),
      status: 200,
    })
  })
  if (registration) {
    await page.route('**/orders', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(registration.body),
        status: registration.status,
      })
    })
  }
  await page.goto('/sales/new')
  await expect(page.getByRole('heading', { name: 'Nova venda' })).toBeVisible({
    timeout: INITIAL_PAGE_READY_TIMEOUT_MS,
  })
  if (addToCart) {
    await page.getByRole('button', { name: 'Adicionar Taça de morango' }).click()
    await page
      .getByRole('dialog', { name: 'Taça de morango' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click()
    await expect(page.getByRole('button', { name: 'Registrar pedido' })).toBeEnabled({
      timeout: INITIAL_PAGE_READY_TIMEOUT_MS,
    })
  }
}
