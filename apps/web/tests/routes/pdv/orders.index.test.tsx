import { expect, test } from '../../playwright'

const CHANNEL_ID = '00000000-0000-4000-8000-000000000020'

const order = {
  id: '00000000-0000-4000-8000-000000000010',
  establishmentId: 'browser-establishment-id',
  idempotencyKey: '00000000-0000-4000-8000-000000000011',
  sequenceNumber: 124,
  createdBy: 'browser-manager-id',
  createdByName: 'Maria Manager',
  status: 'registered',
  channel: { channelId: CHANNEL_ID, name: 'Delivery próprio', percentage: 12 },
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
  ],
  discounts: [],
  subtotal: 20,
  totalDiscount: 0,
  total: 22.4,
  createdAt: '2026-08-28T12:00:00.000Z',
}

const pageBody = {
  items: [order],
  page: 1,
  pageSize: 6,
  total: 1,
  totalPages: 1,
}

test.describe('Pedidos list route', () => {
  test('redirects anonymous users to login', async ({ page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL(/\/login\?returnTo=.*orders/)
  })

  test('renders the Manager list, maps URL filters, and supports keyboard/mobile use', async ({
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
    const channelsMock = await pdvFixture.mockSalesChannels({
      channels: [
        {
          id: CHANNEL_ID,
          establishmentId: 'browser-establishment-id',
          name: 'Delivery próprio',
          percentage: 12,
          status: 'active',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        },
      ],
    })
    const ordersMock = await pdvFixture.mockOrders({ list: { body: pageBody } })

    await page.setViewportSize({ width: 1481, height: 1050 })
    await page.goto('/orders')
    await expect(page.getByRole('heading', { name: /Pedidos/ })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Maria Manager' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Delivery próprio' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '#00124' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ver pedido 124/ })).toBeVisible()
    await page.screenshot({
      path: 'test-results/pdv-orders-index-populated-1481x1050.png',
      fullPage: false,
    })

    const expectedOrderPeriod = await page.evaluate(() => {
      const today = new Date()
      const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
      const to = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999,
      )

      return {
        createdFrom: from.toISOString(),
        createdTo: to.toISOString(),
      }
    })

    const initialListRequest = ordersMock.requests.find(
      (request) => request.method === 'GET',
    )
    expect(initialListRequest?.url.pathname).toBe('/orders')
    expect(initialListRequest?.url.searchParams.get('page')).toBe('1')
    expect(initialListRequest?.url.searchParams.get('pageSize')).toBe('6')
    expect(initialListRequest?.url.searchParams.get('createdFrom')).toBe(
      expectedOrderPeriod.createdFrom,
    )
    expect(initialListRequest?.url.searchParams.get('createdTo')).toBe(
      expectedOrderPeriod.createdTo,
    )

    const channelFilter = page.getByRole('combobox', { name: 'Filtrar por canal' })
    await channelFilter.click()
    await page.getByRole('option', { name: 'Delivery próprio' }).click()
    await expect
      .poll(() => new URL(page.url()).searchParams.get('channelId'))
      .toBe(CHANNEL_ID)
    await expect
      .poll(() => ordersMock.requests.at(-1)?.url.searchParams.get('channelId'))
      .toBe(CHANNEL_ID)

    const statusFilter = page.getByRole('combobox', { name: 'Filtrar por status' })
    await statusFilter.click()
    await page.getByRole('option', { name: 'Registrado' }).click()
    await expect
      .poll(() => new URL(page.url()).searchParams.get('status'))
      .toBe('registered')
    await expect
      .poll(() => ordersMock.requests.at(-1)?.url.searchParams.get('status'))
      .toBe('registered')

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).resolves.toBe(true)
    await page.getByRole('textbox', { name: 'Buscar pedidos' }).focus()
    await page.keyboard.press('Tab')
    await expect(channelFilter).toBeFocused()
    await page.screenshot({
      path: 'test-results/pdv-orders-index-390x844.png',
      fullPage: false,
    })

    expect(channelsMock.requests.some((request) => request.method === 'GET')).toBe(true)
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })

  test('keeps loading and recovers from a failed list request', async ({
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
    let attempts = 0
    await pdvFixture.mockSalesChannels()
    await pdvFixture.mockOrders({
      list: () => {
        attempts += 1
        return attempts === 1
          ? { body: { message: 'temporary failure' }, status: 503 }
          : { body: pageBody }
      },
    })

    await page.goto('/orders')
    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível carregar os pedidos.',
    )
    await page.setViewportSize({ width: 1481, height: 1050 })
    await page.screenshot({
      path: 'test-results/pdv-orders-index-error-1481x1050.png',
      fullPage: false,
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({
      path: 'test-results/pdv-orders-index-error-390x844.png',
      fullPage: false,
    })
    await page.setViewportSize({ width: 1481, height: 1050 })
    await expect(page).toHaveURL(/\/orders\/?(?:\?[^#]*)?$/)
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('cell', { name: '#00124' })).toBeVisible()
    expect(attempts).toBe(2)
    expect(consoleErrors).toHaveLength(1)
    expect(consoleErrors[0]).toContain('503')
    expect(failedRequests).toEqual([])
  })

  test('distinguishes initial-empty and filtered-empty states', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await pdvFixture.mockSalesChannels()
    await pdvFixture.mockOrders()

    await page.goto('/orders')
    await expect(
      page.getByRole('heading', { name: 'Nenhum pedido registrado ainda' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar nova venda' })).toBeVisible()
    await page.setViewportSize({ width: 1481, height: 1050 })
    await page.screenshot({
      path: 'test-results/pdv-orders-index-empty-1481x1050.png',
      fullPage: false,
    })

    await page.goto('/orders?search=pedido-inexistente')
    await expect(
      page.getByRole('heading', { name: 'Nenhum pedido encontrado' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Limpar filtros' }).last(),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/pdv-orders-index-filtered-empty-1481x1050.png',
      fullPage: false,
    })
    await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
    await expect(page).toHaveURL(/\/orders\/?\?search=&period=last-30-days&page=1$/)
  })

  test('captures the list loading state at desktop and narrow viewports', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await pdvFixture.mockSalesChannels()
    await pdvFixture.mockOrders({ list: { body: pageBody } })

    let releaseListRequest!: () => void
    const listRequestPaused = new Promise<void>((resolve) => {
      releaseListRequest = resolve
    })
    await page.route('**/orders**', async (route) => {
      const request = route.request()
      const requestUrl = new URL(request.url())
      if (
        request.method() === 'GET' &&
        requestUrl.pathname === '/orders' &&
        ['fetch', 'xhr'].includes(request.resourceType())
      ) {
        await listRequestPaused
      }
      await route.fallback()
    })

    await page.setViewportSize({ width: 1481, height: 1050 })
    const navigation = page.goto('/orders', { waitUntil: 'commit' })
    await expect(page.getByLabel('Carregando pedidos')).toBeVisible()
    await page.screenshot({
      path: 'test-results/pdv-orders-index-loading-1481x1050.png',
      fullPage: false,
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({
      path: 'test-results/pdv-orders-index-loading-390x844.png',
      fullPage: false,
    })
    releaseListRequest()
    await navigation
    await page.unroute('**/orders**')
  })
})
