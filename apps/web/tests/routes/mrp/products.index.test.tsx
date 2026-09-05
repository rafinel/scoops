import type { Page } from '@playwright/test'

import { expect, test } from '../../playwright'

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

test.describe('Products route', () => {
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
    await expect(page.getByText('Carregando produtos...')).toBeVisible()
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

  test('hides Manager-only registration from Operators', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await mrpFixture.mockProducts({ getResponse: { body: PRODUCT_PAGE } })

    await page.goto('/products')
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Novo produto/ })).toHaveCount(0)
  })
})
