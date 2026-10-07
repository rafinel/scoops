import type { Page } from '@playwright/test'

import { expect, test } from '../playwright'
import { AnalyticsTransportFixture } from '../fixtures/analytics-transport-fixture'
import { IdentityModuleFixture } from '../fixtures/identity-module-fixture'
import { MrpFixture } from '../fixtures/mrp-module-fixture'

const PRODUCT = {
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Leite integral',
  unit: 'l',
  categories: ['ingredient'],
  stockControl: 'single',
  status: 'active',
  idealStock: 10,
  createdAt: '2026-08-17T12:00:00.000Z',
  updatedAt: '2026-08-17T12:00:00.000Z',
}

const PRODUCT_PAGE = {
  items: [
    {
      product: PRODUCT,
      brandCount: 0,
      stockQuantity: 0,
      idealStock: 10,
      stockSituation: 'low',
    },
  ],
  page: 1,
  pageSize: 10,
  totalItems: 1,
  totalPages: 1,
  kpis: { products: 22, brands: 7, lowStock: 4 },
}

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

test.describe('ProductsPage', () => {
  test('redirects anonymous users while preserving the requested search state', async ({
    page,
  }) => {
    await page.goto('/products?search=milk&page=2')
    await expect(page).toHaveURL(/\/login\?returnTo=/)

    const returnTo = new URL(page.url()).searchParams.get('returnTo')
    expect(returnTo).toContain('search=milk')
    expect(returnTo).toContain('page=2')
  })

  test('renders the Manager catalog, maps the initial request, and navigates to registration', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    const { consoleErrors, failedRequests } = addDiagnostics(page)
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const productsMock = await mrpFixture.mockProducts({
      getResponse: { body: PRODUCT_PAGE },
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
    await expect(page.getByText('Leite integral')).toBeVisible()
    await expect(page.getByText('22')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ingrediente' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Detalhes →' })).toHaveAttribute(
      'href',
      '/products/product-1',
    )

    const request = productsMock.requests[0]
    expect(request.pathname).toBe('/products')
    expect(request.searchParams.get('page')).toBe('1')
    expect(request.searchParams.get('pageSize')).toBe('10')
    expect(request.searchParams.get('sortBy')).toBe('createdAt')
    expect(request.searchParams.get('sortDirection')).toBe('desc')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('textbox', { name: 'Buscar produtos' }).focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Filtros' })).toBeFocused()
    await expect(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).resolves.toBe(true)

    await page.getByRole('link', { name: /Novo produto/ }).click()
    await expect(page).toHaveURL('/products/new')
    await expect(page.getByRole('heading', { name: 'Novo produto' })).toBeVisible()
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })

  test('synchronizes search, filters, sorting, pagination, URL, and request parameters', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const productsMock = await mrpFixture.mockProducts({
      getResponse: (request) => {
        const currentPage = Number(request.searchParams.get('page') ?? 1)
        return {
          body: {
            ...PRODUCT_PAGE,
            items: [
              {
                ...PRODUCT_PAGE.items[0],
                product: {
                  ...PRODUCT,
                  id: `product-${currentPage}`,
                  name: currentPage === 2 ? 'Café moído' : 'Leite integral',
                },
              },
            ],
            page: currentPage,
            totalItems: 21,
            totalPages: 3,
          },
        }
      },
    })

    await page.goto('/products?search=milk&page=2')
    await expect(page.getByText('Café moído')).toBeVisible()
    expect(productsMock.requests[0].searchParams.get('search')).toBe('milk')
    expect(productsMock.requests[0].searchParams.get('page')).toBe('2')

    const search = page.getByRole('textbox', { name: 'Buscar produtos' })
    await search.fill('tea')
    await expect
      .poll(() => productsMock.requests.at(-1)?.searchParams.get('search'))
      .toBe('tea')
    await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('1')

    await page.getByRole('button', { name: 'Filtros' }).click()
    const filters = page.getByRole('dialog', { name: 'Filtrar produtos' })
    await expect(filters).toBeVisible()
    await filters.getByRole('button', { name: 'Ingrediente' }).click()
    await filters.getByRole('button', { name: 'Baixo' }).click()
    await filters.getByRole('button', { name: 'Ativo', exact: true }).click()
    await expect(filters.getByRole('button', { name: 'Ingrediente' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await filters.getByRole('button', { name: 'Aplicar filtros' }).click()
    await expect(filters).toBeHidden()
    await expect
      .poll(() => productsMock.requests.at(-1)?.searchParams.get('category'))
      .toBe('ingredient')
    expect(productsMock.requests.at(-1)?.searchParams.get('stockSituation')).toBe('low')
    expect(productsMock.requests.at(-1)?.searchParams.get('status')).toBe('active')
    expect(new URL(page.url()).searchParams.get('categories')).toBe('["ingredient"]')
    expect(new URL(page.url()).searchParams.get('page')).toBe('1')
    await expect(page.getByRole('button', { name: 'Filtros (3)' })).toBeVisible()

    await page.getByRole('button', { name: 'Ordenar por Produto' }).click()
    await expect
      .poll(() => productsMock.requests.at(-1)?.searchParams.get('sortBy'))
      .toBe('name')
    expect(productsMock.requests.at(-1)?.searchParams.get('sortDirection')).toBe('asc')
    expect(new URL(page.url()).searchParams.get('page')).toBe('1')

    await page.getByRole('button', { name: 'Próxima página' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText('Café moído')).toBeVisible()
    expect(productsMock.requests.at(-1)?.searchParams.get('page')).toBe('2')
    expect(productsMock.requests.at(-1)?.searchParams.get('pageSize')).toBe('10')
  })

  test('exposes the loading state while the catalog request is pending', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let releaseRequest!: () => void
    const requestPaused = new Promise<void>((resolve) => {
      releaseRequest = resolve
    })

    await page.route('**/products**', async (route) => {
      const request = route.request()
      const requestUrl = new URL(request.url())
      if (
        request.method() === 'GET' &&
        requestUrl.pathname === '/products' &&
        ['fetch', 'xhr'].includes(request.resourceType())
      ) {
        await requestPaused
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(PRODUCT_PAGE),
        })
        return
      }
      await route.continue()
    })

    const navigation = page.goto('/products', { waitUntil: 'commit' })
    await expect(page.getByRole('status', { name: 'Carregando produtos' })).toBeVisible()
    releaseRequest()
    await navigation
    await expect(page.getByText('Leite integral')).toBeVisible()
  })

  test('shows a recoverable request error and refetches the catalog', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    const { failedRequests } = addDiagnostics(page)
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let attempts = 0
    const productsMock = await mrpFixture.mockProducts({
      getResponse: () => {
        attempts += 1
        return attempts === 1
          ? { status: 503, body: { message: 'temporary failure' } }
          : { body: PRODUCT_PAGE }
      },
    })

    await page.goto('/products')
    await expect(page.getByText('Não foi possível carregar os produtos.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Leite integral')).toBeVisible()
    expect(attempts).toBe(2)
    expect(productsMock.requests).toHaveLength(2)
    expect(failedRequests).toEqual([])
  })

  test('distinguishes the initial empty state from a filtered empty state', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const productsMock = await mrpFixture.mockProducts({
      getResponse: { body: { ...PRODUCT_PAGE, items: [], totalItems: 0, totalPages: 0 } },
    })

    await page.goto('/products')
    await expect(
      page.getByRole('heading', { name: 'Seu catálogo está vazio' }),
    ).toBeVisible()
    await expect(
      page.getByText(
        'Cadastre seu primeiro produto para começar a acompanhar o estoque.',
      ),
    ).toBeVisible()

    await page.goto('/products?search=unknown')
    await expect(
      page.getByRole('heading', { name: 'Nenhum produto encontrado' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    const clearedSearch = new URL(page.url()).searchParams
    expect(clearedSearch.get('search')).toBe('')
    expect(clearedSearch.get('page')).toBe('1')
    expect(clearedSearch.get('categories')).toBe('[]')
    expect(productsMock.requests.length).toBeGreaterThanOrEqual(2)
  })

  test('lets Operators read Products without registration controls', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await mrpFixture.mockProducts({ getResponse: { body: PRODUCT_PAGE } })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/products')
    await expect(page).toHaveURL(/\/products(?:\?|$)/)
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
    await expect(page.getByText('Leite integral')).toBeVisible()
    await expect(page.getByRole('link', { name: /Novo produto/ })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Tipos de acompanhamento/ })).toHaveCount(
      0,
    )
    await page.screenshot({ path: 'test-results/f10-operator-products-1440x900.png' })
  })

  if (process.env.SCOOPS_PLAYWRIGHT_ANALYTICS_FIXTURE === '1') {
    test.describe('analytics', () => {
      test.use({
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      })

      test('filters real SDK transport and rejects malformed consumer observations', async ({
        page,
        identityFixture,
        mrpFixture,
        analyticsTransportFixture,
      }) => {
        await identityFixture.mockManagerSession()
        await identityFixture.mockManagerAccount()
        await mrpFixture.mockProducts({ getResponse: { body: PRODUCT_PAGE } })
        await page.addInitScript(() => {
          Object.defineProperties(Navigator.prototype, {
            webdriver: { configurable: true, get: () => false },
            userAgentData: { configurable: true, get: () => undefined },
          })
        })
        await page.goto('/products')

        await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
        await expect(
          page.getByRole('button', { name: 'Emit analytics contract events' }),
        ).toBeVisible()
        expect(
          await page.evaluate(() => ({
            webdriver: navigator.webdriver,
            userAgentData: Reflect.get(navigator, 'userAgentData'),
          })),
        ).toEqual({ webdriver: false, userAgentData: undefined })
        await expect
          .poll(() => analyticsTransportFixture.requests().length)
          .toBeGreaterThan(0)
        await expect
          .poll(() =>
            analyticsTransportFixture
              .events()
              .some(({ event }) => event === 'feature_visited'),
          )
          .toBe(true)

        await page.getByRole('button', { name: 'Emit analytics contract events' }).click()
        await expect
          .poll(() => analyticsTransportFixture.events().map(({ event }) => event))
          .toEqual(
            expect.arrayContaining([
              '$identify',
              'feature_visited',
              'onboarding_started',
              'onboarding_registration_completed',
              'email_confirmation_completed',
              'workflow_started',
              'workflow_completed',
              'workflow_validation_failed',
              'workflow_blocked',
              'workflow_failed',
            ]),
          )

        const eventNames = analyticsTransportFixture.events().map(({ event }) => event)
        for (const expectedEvent of [
          '$identify',
          'feature_visited',
          'onboarding_started',
          'onboarding_registration_completed',
          'email_confirmation_completed',
          'workflow_started',
          'workflow_completed',
          'workflow_validation_failed',
          'workflow_blocked',
          'workflow_failed',
        ]) {
          expect(eventNames).toContain(expectedEvent)
        }

        const completedAttemptsBefore =
          analyticsTransportFixture.eventAttempts('workflow_completed').length
        await page
          .getByRole('button', { name: 'Emit completion retry analytics' })
          .click()
        await expect
          .poll(() =>
            analyticsTransportFixture
              .eventAttempts('workflow_completed')
              .slice(completedAttemptsBefore)
              .some(
                (event) =>
                  (event.properties as Record<string, unknown> | undefined)
                    ?.attempt === 2,
              ),
          )
          .toBe(true)
        const completedRetry = analyticsTransportFixture
          .eventAttempts('workflow_completed')
          .slice(completedAttemptsBefore)
        const firstCompletionProperties = completedRetry[0]?.properties
        const retryCompletionProperties = completedRetry[1]?.properties
        expect(firstCompletionProperties).toMatchObject({ attempt: 1 })
        expect(retryCompletionProperties).toMatchObject({ attempt: 2 })
        expect(retryCompletionProperties).toHaveProperty(
          'workflow_id',
          (firstCompletionProperties as Record<string, unknown> | undefined)?.workflow_id,
        )

        await page
          .getByRole('button', { name: 'Emit malformed analytics candidates' })
          .click()
        await page.waitForTimeout(100)
        const serializedEvents = JSON.stringify(analyticsTransportFixture.events())
        expect(serializedEvents).not.toContain('PRIVATE_SENTINEL')
        expect(serializedEvents).not.toContain('manager@example.com')
        expect(serializedEvents).not.toContain('browser-manager-session')

        const storedValues = await page.evaluate(() => {
          const result: string[] = []
          for (let index = 0; index < window.localStorage.length; index += 1) {
            const key = window.localStorage.key(index)
            if (key) result.push(`${key}:${window.localStorage.getItem(key)}`)
          }
          return result.join('\n')
        })
        expect(storedValues).not.toContain('PRIVATE_SENTINEL')
        expect(storedValues).not.toContain('manager@example.com')
        expect(storedValues).not.toContain('browser-manager-session')
      })

      test('suspends a peer tab until its next auth resolution', async ({
        page,
        identityFixture,
        mrpFixture,
        analyticsTransportFixture,
      }) => {
        await identityFixture.mockManagerSession()
        await identityFixture.mockManagerAccount()
        await mrpFixture.mockProducts({ getResponse: { body: PRODUCT_PAGE } })
        await page.addInitScript(() => {
          Object.defineProperties(Navigator.prototype, {
            webdriver: { configurable: true, get: () => false },
            userAgentData: { configurable: true, get: () => undefined },
          })
        })
        await page.goto('/products')
        await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
        await expect
          .poll(() =>
            analyticsTransportFixture
              .events()
              .some(({ event }) => event === 'feature_visited'),
          )
          .toBe(true)
        const initialMarker = await page.evaluate(() =>
          window.localStorage.getItem('scoops.product-telemetry.invalidation.v1'),
        )
        expect(initialMarker).toBeTruthy()
        const initialEventCount = analyticsTransportFixture.events().length

        const peerPage = await page.context().newPage()
        try {
          const peerIdentityFixture = IdentityModuleFixture(peerPage)
          const peerTransportFixture = AnalyticsTransportFixture(peerPage)
          const peerMrpFixture = MrpFixture(peerPage)
          await peerTransportFixture.install()
          await peerIdentityFixture.mockManagerSession()
          await peerIdentityFixture.mockManagerAccount()
          await peerMrpFixture.mockProducts({ getResponse: { body: PRODUCT_PAGE } })
          await peerPage.addInitScript(() => {
            Object.defineProperties(Navigator.prototype, {
              webdriver: { configurable: true, get: () => false },
              userAgentData: { configurable: true, get: () => undefined },
            })
          })
          await peerPage.goto('/products')
          await expect(peerPage.getByRole('heading', { name: 'Produtos' })).toBeVisible()
          await expect
            .poll(
              () =>
                peerTransportFixture
                  .events()
                  .filter(({ event }) => event === 'feature_visited').length,
            )
            .toBeGreaterThan(0)

          await expect
            .poll(() =>
              page.evaluate(() =>
                window.localStorage.getItem('scoops.product-telemetry.invalidation.v1'),
              ),
            )
            .not.toBe(initialMarker)
          const peerAccountMarker = await page.evaluate(() =>
            window.localStorage.getItem('scoops.product-telemetry.invalidation.v1'),
          )

          await page
            .getByRole('button', { name: 'Emit analytics contract events' })
            .click()
          await page.waitForTimeout(500)
          expect(analyticsTransportFixture.events()).toHaveLength(initialEventCount)

          await peerIdentityFixture.mockOperatorSession()
          await peerIdentityFixture.mockOperatorAccount()
          await peerPage.reload()
          await expect(peerPage.getByRole('heading', { name: 'Produtos' })).toBeVisible()
          await expect
            .poll(() =>
              page.evaluate(() =>
                window.localStorage.getItem('scoops.product-telemetry.invalidation.v1'),
              ),
            )
            .not.toBe(peerAccountMarker)

          await page
            .getByRole('button', { name: 'Emit analytics contract events' })
            .click()
          await page.waitForTimeout(500)
          expect(analyticsTransportFixture.events()).toHaveLength(initialEventCount)

          await identityFixture.mockOperatorSession()
          await identityFixture.mockOperatorAccount()
          await page.reload()
          await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
          await expect
            .poll(() =>
              analyticsTransportFixture
                .events()
                .some(
                  ({ event, properties }) =>
                    event === 'feature_visited' &&
                    typeof properties === 'object' &&
                    properties !== null &&
                    (properties as Record<string, unknown>).role === 'operator',
                ),
            )
            .toBe(true)
        } finally {
          await peerPage.close()
        }
      })
    })
  }
})
