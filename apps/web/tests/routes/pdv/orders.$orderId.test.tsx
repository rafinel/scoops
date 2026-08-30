import { expect, test } from '../../playwright'

const ORDER_ID = '00000000-0000-4000-8000-000000000010'

function orderResponse(
  status: 'registered' | 'canceled' = 'registered',
  includeChannel = true,
) {
  return {
    id: ORDER_ID,
    establishmentId: 'browser-establishment-id',
    idempotencyKey: '00000000-0000-4000-8000-000000000011',
    sequenceNumber: 124,
    createdBy: 'browser-manager-id',
    createdByName: 'Maria Manager',
    status,
    ...(includeChannel
      ? {
          channel: {
            channelId: '00000000-0000-4000-8000-000000000020',
            name: 'Delivery próprio',
            percentage: 12,
          },
        }
      : {}),
    lines: [
      {
        product: {
          productId: '00000000-0000-4000-8000-000000000030',
          name: 'Açaí',
          kind: 'portion',
        },
        size: {
          sizeId: '00000000-0000-4000-8000-000000000031',
          name: '500 ml',
          quantity: 1,
        },
        accompaniments: [],
        quantity: 1,
        baseUnitPrice: 20,
        finalUnitPrice: 20,
        subtotal: 20,
        consumptions: [],
      },
      {
        product: {
          productId: '00000000-0000-4000-8000-000000000040',
          name: 'Cupuaçu',
          kind: 'portion',
        },
        brand: {
          brandId: '00000000-0000-4000-8000-000000000041',
          name: 'Marca Gelada',
        },
        size: {
          sizeId: '00000000-0000-4000-8000-000000000042',
          name: '300 ml',
          quantity: 1,
        },
        accompaniments: [
          {
            accompanimentId: '00000000-0000-4000-8000-000000000043',
            name: 'Leite em pó',
            type: 'portion',
            quantity: 1,
            basePrice: 2,
            finalPrice: 2,
          },
        ],
        quantity: 1,
        baseUnitPrice: 10,
        finalUnitPrice: 12,
        subtotal: 12,
        consumptions: [
          {
            productId: '00000000-0000-4000-8000-000000000044',
            productName: 'Polpa de cupuaçu',
            brandId: '00000000-0000-4000-8000-000000000045',
            brandName: 'Fornecedor A',
            quantity: 0.5,
          },
        ],
      },
    ],
    discounts: [],
    subtotal: 32,
    totalDiscount: 0,
    total: includeChannel ? 35.84 : 32,
    createdAt: '2026-08-28T12:00:00.000Z',
    ...(status === 'canceled'
      ? {
          cancellation: {
            canceledAt: '2026-08-28T13:00:00.000Z',
            canceledBy: 'browser-manager-id',
            canceledByName: 'Maria Manager',
            reason: 'Cliente solicitou o cancelamento',
            restorations: [
              {
                productId: '00000000-0000-4000-8000-000000000030',
                productName: 'Açaí',
                quantity: 1,
                outcome: 'restored',
              },
            ],
          },
        }
      : {}),
  }
}

test.describe('Pedido detail route', () => {
  test('protects unknown detail URLs and renders a safe not-found state', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    await page.goto(`/orders/${ORDER_ID}`)
    await expect(page).toHaveURL(/\/login\?returnTo=.*orders/)

    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await pdvFixture.mockOrders({
      detail: { body: { message: 'not found' }, status: 404 },
    })
    await page.goto(`/orders/${ORDER_ID}`)
    await expect(
      page.getByRole('heading', { name: 'Pedido não encontrado' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Voltar para pedidos' })).toBeVisible()
    await page.setViewportSize({ width: 1481, height: 1050 })
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-not-found-1481x1050.png',
      fullPage: false,
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-not-found-390x844.png',
      fullPage: false,
    })
  })

  test('renders Manager details, retries cancellation, and preserves the canceled snapshot', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    const consoleErrors: string[] = []
    const failedRequests: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => failedRequests.push(request.url()))

    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await pdvFixture.mockSalesChannels()
    let currentOrder = orderResponse()
    let cancelAttempts = 0
    const ordersMock = await pdvFixture.mockOrders({
      detail: () => ({ body: currentOrder }),
      cancel: (request) => {
        cancelAttempts += 1
        if (cancelAttempts === 1)
          return { body: { message: 'temporary failure' }, status: 503 }
        expect(request.body).toEqual({ reason: 'Cliente solicitou o cancelamento' })
        currentOrder = orderResponse('canceled')
        return { body: currentOrder }
      },
    })

    await page.setViewportSize({ width: 1481, height: 1050 })
    await page.goto(`/orders/${ORDER_ID}`)
    await expect(page.getByRole('heading', { name: 'Pedido #00124' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Itens do pedido' })).toBeVisible()
    const orderItemsSection = page.locator('section[aria-labelledby="order-items-title"]')
    await expect(orderItemsSection.getByText('Produto', { exact: true })).toBeVisible()
    await expect(orderItemsSection.getByText('Qtd.', { exact: true })).toBeVisible()
    await expect(
      orderItemsSection.getByText('Unitário', { exact: true }).first(),
    ).toBeVisible()
    await expect(
      orderItemsSection.getByText('Total', { exact: true }).first(),
    ).toBeVisible()
    const itemHeaderCells = orderItemsSection.locator(
      '[data-slot="order-items-header"] > span',
    )
    const firstItemRowCells = orderItemsSection
      .locator('[data-slot="order-item-row"]')
      .first()
      .locator(':scope > div')
    await expect(itemHeaderCells).toHaveCount(4)
    await expect(firstItemRowCells).toHaveCount(4)
    for (const columnIndex of [1, 2, 3]) {
      const headerBox = await itemHeaderCells.nth(columnIndex).boundingBox()
      const valueBox = await firstItemRowCells.nth(columnIndex).boundingBox()
      expect((headerBox?.x ?? 0) + (headerBox?.width ?? 0)).toBeCloseTo(
        (valueBox?.x ?? 0) + (valueBox?.width ?? 0),
        5,
      )
    }
    const orderTotalsSection = page.locator(
      'section[aria-labelledby="order-totals-title"]',
    )
    const informationTrigger = page.getByRole('button', {
      name: 'Informações do pedido',
      exact: true,
    })
    const totalsTrigger = page.getByRole('button', {
      name: 'Delivery próprio',
      exact: true,
    })
    const informationPanel = page.locator('[data-slot="accordion-panel"]').nth(0)
    const totalsPanel = page.locator('[data-slot="accordion-panel"]').nth(1)
    const desktopChannelModifier = totalsPanel.locator('div.hidden.xl\\:flex')
    const mobileOrderTotals = totalsPanel.locator('div.space-y-3.xl\\:hidden')
    await expect(orderTotalsSection).toBeVisible()
    const itemsSectionBox = await orderItemsSection.boundingBox()
    const totalSectionBox = await orderTotalsSection.boundingBox()
    const summaryInfoBox = await informationTrigger.boundingBox()
    expect(itemsSectionBox?.x).toBeLessThan(summaryInfoBox?.x ?? Number.POSITIVE_INFINITY)
    expect(totalSectionBox?.x).toBeLessThan(summaryInfoBox?.x ?? Number.POSITIVE_INFINITY)
    expect(totalSectionBox?.x).toBeCloseTo(itemsSectionBox?.x ?? 0, 5)
    expect(summaryInfoBox?.x).toBeGreaterThanOrEqual(
      (itemsSectionBox?.x ?? 0) + (itemsSectionBox?.width ?? 0),
    )
    expect(totalSectionBox?.y).toBeGreaterThan(
      itemsSectionBox
        ? itemsSectionBox.y + itemsSectionBox.height
        : Number.NEGATIVE_INFINITY,
    )
    const wideItemRows = page.locator(
      'section[aria-labelledby="order-items-title"] article',
    )
    await expect(wideItemRows).toHaveCount(2)
    const wideItemRowBoxes = await wideItemRows.evaluateAll((elements) =>
      elements.map((element) => {
        const { bottom, left, top } = element.getBoundingClientRect()
        return { bottom, left, top }
      }),
    )
    expect(wideItemRowBoxes.at(0)?.left).toBeCloseTo(
      wideItemRowBoxes.at(1)?.left ?? Number.POSITIVE_INFINITY,
      5,
    )
    expect(wideItemRowBoxes.at(1)?.top).toBeGreaterThanOrEqual(
      wideItemRowBoxes.at(0)?.bottom ?? Number.NEGATIVE_INFINITY,
    )
    await expect(orderTotalsSection).toContainText('Subtotal dos produtos')
    await expect(orderTotalsSection).toContainText('Acrescimo do canal')
    await expect(orderTotalsSection).toContainText('Total do pedido')
    await expect(desktopChannelModifier).toBeVisible()
    await expect(desktopChannelModifier).toContainText('Acrescimo do canal')
    await expect(mobileOrderTotals).toBeHidden()
    await expect(page.getByText('Informações do pedido', { exact: true })).toBeVisible()
    await expect(informationTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(totalsTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(informationTrigger).toHaveAttribute('data-panel-open', '')
    await expect(totalsTrigger).toHaveAttribute('data-panel-open', '')
    await expect(informationPanel).toHaveAttribute('data-open', '')
    await expect(totalsPanel).toHaveAttribute('data-open', '')
    await expect(informationPanel).toHaveClass(/transition-\[height,opacity\]/)
    await expect(informationPanel).toHaveAttribute('style', /--accordion-panel-height/)
    const accordionItemGap = await page.evaluate(() => {
      const itemBoxes = [
        ...document.querySelectorAll('[data-slot="accordion-item"]'),
      ].map((item) => item.getBoundingClientRect())

      return itemBoxes[1].top - itemBoxes[0].bottom
    })
    expect(accordionItemGap).toBeCloseTo(20, 5)
    await informationTrigger.focus()
    await page.keyboard.press('Enter')
    await expect(informationTrigger).toHaveAttribute('aria-expanded', 'false')
    await expect(totalsTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(informationTrigger).not.toHaveAttribute('data-panel-open')
    await totalsTrigger.focus()
    await page.keyboard.press('Space')
    await expect(totalsTrigger).toHaveAttribute('aria-expanded', 'false')
    await expect(informationTrigger).toHaveAttribute('aria-expanded', 'false')
    await totalsTrigger.focus()
    await page.keyboard.press('Enter')
    await informationTrigger.focus()
    await page.keyboard.press('Enter')
    await expect(informationTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(totalsTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('link', { name: 'Voltar para pedidos' })).toHaveAttribute(
      'href',
      '/orders',
    )
    await expect(page.getByText('Maria Manager')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toBeVisible()
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-registered-1481x1050.png',
      fullPage: false,
    })

    await page.getByRole('button', { name: 'Cancelar pedido' }).click()
    const dialog = page.getByRole('dialog', { name: 'Cancelar pedido?' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('O pedido permanecerá no histórico')).toBeVisible()
    await page.setViewportSize({ width: 657, height: 602 })
    await page.screenshot({
      path: 'test-results/pdv-orders-cancellation-dialog-657x602.png',
      fullPage: false,
    })
    await page.setViewportSize({ width: 1481, height: 1050 })
    const reason = dialog.getByRole('textbox', {
      name: 'Motivo do cancelamento (opcional)',
    })
    await reason.fill('  Cliente solicitou o cancelamento  ')
    await dialog.getByRole('button', { name: 'Cancelar pedido' }).click()
    await expect(dialog.getByRole('alert')).toBeVisible()
    await expect(reason).toHaveValue('  Cliente solicitou o cancelamento  ')
    await dialog.getByRole('button', { name: 'Cancelar pedido' }).click()
    await expect(page.getByText('Cancelado por')).toBeVisible()
    const cancellationAlert = page
      .getByRole('alert')
      .filter({ hasText: 'Pedido cancelado' })
    await expect(cancellationAlert).toHaveCount(0)
    await expect(informationPanel).toContainText('Cancelado em')
    await expect(informationPanel).toContainText('Cancelado por')
    await expect(informationPanel).toContainText('Motivo do cancelamento')
    await expect(informationPanel).not.toContainText('Restauração do estoque')
    await expect(informationPanel).not.toContainText('Restaurado: Açaí (1)')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0)
    expect(
      ordersMock.requests.some(
        (request) =>
          request.method === 'PATCH' &&
          request.url.pathname === `/orders/${ORDER_ID}/cancel`,
      ),
    ).toBe(true)

    await page.screenshot({
      path: 'test-results/pdv-orders-detail-canceled-1481x1050.png',
      fullPage: false,
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).resolves.toBe(true)
    const narrowSummaryTitleBox = await page
      .getByText('Informações do pedido', { exact: true })
      .boundingBox()
    const narrowItemsTitleBox = await page
      .getByRole('heading', { name: 'Itens do pedido' })
      .boundingBox()
    expect(narrowSummaryTitleBox?.y).toBeLessThan(
      narrowItemsTitleBox?.y ?? Number.POSITIVE_INFINITY,
    )
    await expect(orderTotalsSection).toBeHidden()
    await expect(desktopChannelModifier).toBeHidden()
    await expect(mobileOrderTotals).toBeVisible()
    await expect(mobileOrderTotals).toContainText('Subtotal dos produtos')
    await expect(mobileOrderTotals).toContainText('Acrescimo do canal')
    await expect(mobileOrderTotals).toContainText('Total do pedido')
    const narrowItemsSectionBox = await orderItemsSection.boundingBox()
    const narrowSummaryInfoBox = await informationTrigger.boundingBox()
    expect(narrowSummaryInfoBox?.y).toBeLessThan(
      narrowItemsSectionBox?.y ?? Number.POSITIVE_INFINITY,
    )
    await expect(
      page.evaluate(() => {
        const summaryTitle = [
          ...document.querySelectorAll('[data-slot="accordion-trigger"]'),
        ].find((element) => element.textContent?.includes('Informações do pedido'))
        const itemsTitle = document.getElementById('order-items-title')

        return Boolean(
          summaryTitle &&
            itemsTitle &&
            summaryTitle.compareDocumentPosition(itemsTitle) &
              Node.DOCUMENT_POSITION_FOLLOWING,
        )
      }),
    ).resolves.toBe(true)
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-canceled-390x844.png',
      fullPage: false,
    })
    await page.setViewportSize({ width: 359, height: 820 })
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-summary-first-359x820.png',
      fullPage: false,
    })
    expect(consoleErrors).toHaveLength(1)
    expect(consoleErrors[0]).toContain('503')
    expect(failedRequests).toEqual([])
  })

  test('keeps cancellation Manager-only and exposes canceled history read-only', async ({
    page,
    browser,
    identityFixture,
    pdvFixture,
  }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await pdvFixture.mockOrders({ detail: { body: orderResponse() } })
    await page.goto(`/orders/${ORDER_ID}`)
    await expect(page.getByRole('heading', { name: 'Pedido #00124' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0)

    const managerContext = await browser.newContext({ baseURL: 'http://127.0.0.1:4000' })
    const managerPage = await managerContext.newPage()
    try {
      const managerIdentity = await import('../../fixtures/identity-module-fixture').then(
        ({ IdentityModuleFixture }) => IdentityModuleFixture(managerPage),
      )
      await managerIdentity.mockAnonymousProvider()
      await managerIdentity.mockManagerSession()
      await managerIdentity.mockManagerAccount()
      await managerPage.route('**/orders/*', async (route) => {
        if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
          await route.continue()
          return
        }

        if (new URL(route.request().url()).pathname === `/orders/${ORDER_ID}`) {
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify(orderResponse('canceled')),
          })
          return
        }
        await route.continue()
      })
      await managerPage.goto(`/orders/${ORDER_ID}`)
      await expect(managerPage.getByText('Cancelado', { exact: true })).toBeVisible()
      await expect(managerPage.getByText('Restauração do estoque')).toHaveCount(0)
      await expect(managerPage.getByText('Restaurado: Açaí (1)')).toHaveCount(0)
      await expect(
        managerPage.getByRole('alert').filter({ hasText: 'Pedido cancelado' }),
      ).toHaveCount(0)
      await expect(
        managerPage.getByRole('button', { name: 'Cancelar pedido' }),
      ).toHaveCount(0)
    } finally {
      await managerContext.close()
    }
  })

  test('omits the channel summary for canceled orders without a sale channel', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await pdvFixture.mockOrders({
      detail: { body: orderResponse('canceled', false) },
    })

    await page.setViewportSize({ width: 1481, height: 1050 })
    await page.goto(`/orders/${ORDER_ID}`)
    const informationTrigger = page.getByRole('button', {
      name: 'Informações do pedido',
      exact: true,
    })
    const informationPanel = page.locator('[data-slot="accordion-panel"]').first()
    await expect(informationTrigger).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Sem canal', exact: true }),
    ).toHaveCount(0)
    await expect(page.getByText('Cancelado', { exact: true })).toBeVisible()
    await expect(informationPanel).toContainText('Cancelado em')
    await expect(informationPanel).toContainText('Cancelado por')
    await expect(informationPanel).toContainText('Motivo do cancelamento')
    await expect(informationPanel).not.toContainText('Restauração do estoque')
    await expect(informationPanel).not.toContainText('Restaurado: Açaí (1)')
    await expect(
      page.getByRole('alert').filter({ hasText: 'Pedido cancelado' }),
    ).toHaveCount(0)
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-no-channel-canceled-1481x1050.png',
      fullPage: false,
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).resolves.toBe(true)
    const narrowSummaryTitleBox = await informationTrigger.boundingBox()
    const narrowItemsTitleBox = await page
      .getByRole('heading', { name: 'Itens do pedido' })
      .boundingBox()
    expect(narrowSummaryTitleBox?.y).toBeLessThan(
      narrowItemsTitleBox?.y ?? Number.POSITIVE_INFINITY,
    )
    await expect(
      page.getByRole('button', { name: 'Sem canal', exact: true }),
    ).toHaveCount(0)
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-no-channel-canceled-390x844.png',
      fullPage: false,
    })
  })

  test('captures the detail loading state at desktop and narrow viewports', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await pdvFixture.mockSalesChannels()
    await pdvFixture.mockOrders({ detail: { body: orderResponse() } })

    let releaseDetailRequest!: () => void
    const detailRequestPaused = new Promise<void>((resolve) => {
      releaseDetailRequest = resolve
    })
    await page.route('**/orders**', async (route) => {
      const request = route.request()
      if (
        request.method() === 'GET' &&
        ['fetch', 'xhr'].includes(request.resourceType())
      ) {
        await detailRequestPaused
      }
      await route.fallback()
    })

    await page.setViewportSize({ width: 1481, height: 1050 })
    const navigation = page.goto(`/orders/${ORDER_ID}`, { waitUntil: 'commit' })
    await expect(page.getByLabel('Carregando detalhes do pedido')).toBeVisible()
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-loading-1481x1050.png',
      fullPage: false,
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({
      path: 'test-results/pdv-orders-detail-loading-390x844.png',
      fullPage: false,
    })
    releaseDetailRequest()
    await navigation
    await page.unroute('**/orders**')
  })
})
