import type { Page } from '@playwright/test'

import type { IdentityModuleFixture } from '../../fixtures/identity-module-fixture'
import { expect, test } from '../../playwright'

const CREATED_PRODUCT = {
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Chocolate',
  unit: 'un',
  categories: ['ingredient'],
  stockControl: 'single',
  allowNegativeStock: false,
  idealStock: 10,
  createdAt: '2026-08-17T12:00:00.000Z',
  updatedAt: '2026-08-17T12:00:00.000Z',
}

const STOCK_RESPONSE = {
  product: CREATED_PRODUCT,
  brands: [],
  stockQuantity: 4,
  idealStock: 10,
  stockSituation: 'normal',
}

function addDiagnostics(page: Page) {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
    )
  })

  return { consoleErrors, failedRequests }
}

async function openRegistration(page: Page, identityFixture: IdentityModuleFixture) {
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await page.goto('/products/new')
  await expect(page.getByRole('heading', { name: 'Novo produto' })).toBeVisible()
}

async function assertDiagnostics(
  page: Page,
  consoleErrors: string[],
  failedRequests: string[],
) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )
  expect(overflow).toBe(true)
  expect(consoleErrors).toEqual([])
  expect(failedRequests).toEqual([])
}

test.describe('New product route', () => {
  test('captures the single-stock desktop and narrow states with keyboard focus', async ({
    page,
    identityFixture,
  }) => {
    const { consoleErrors, failedRequests } = addDiagnostics(page)
    await openRegistration(page, identityFixture)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await expect(page.getByRole('button', { name: 'Criar produto' })).toBeVisible()
    await page.screenshot({
      path: 'test-results/f5-k4tYU-single-desktop-1440x900.png',
      fullPage: false,
    })

    await page.setViewportSize({ width: 390, height: 844 })
    const nameInput = page.getByRole('textbox', { name: 'Nome', exact: true })
    await nameInput.focus()
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('placeholder')),
    ).toBe('Ex: Polpa de Açaí')
    await page.screenshot({
      path: 'test-results/f5-g9l12m-single-narrow-390x844.png',
      fullPage: false,
    })

    await assertDiagnostics(page, consoleErrors, failedRequests)
  })

  test('captures the by-brand desktop and narrow states without clipping', async ({
    page,
    identityFixture,
  }) => {
    const { consoleErrors, failedRequests } = addDiagnostics(page)
    await openRegistration(page, identityFixture)
    await page.getByRole('button', { name: 'Por marca' }).click()
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Açaí')
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await expect(page.getByRole('radio', { name: 'Marca principal 1' })).toBeVisible()
    await page.getByRole('button', { name: 'Adicionar outra marca' }).click()
    await expect(page.getByRole('radio', { name: 'Marca principal 2' })).toBeVisible()
    await page.getByRole('radio', { name: 'Marca principal 2' }).check({ force: true })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page
      .getByRole('heading', { name: 'Controle de estoque' })
      .scrollIntoViewIfNeeded()
    await page
      .getByText('Total calculado pelas quantidades iniciais das marcas.')
      .scrollIntoViewIfNeeded()
    await page.screenshot({
      path: 'test-results/f5-lZGJu-by-brand-desktop-1440x900.png',
      fullPage: false,
    })

    await page.setViewportSize({ width: 390, height: 844 })
    const createButton = page.getByRole('button', { name: 'Criar produto' })
    await createButton.scrollIntoViewIfNeeded()
    await expect(createButton).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    await page.getByRole('radio', { name: 'Marca principal 2' }).focus()
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
    ).toBe('Marca principal 2')
    await page.screenshot({
      path: 'test-results/f5-z41Sbx-by-brand-narrow-390x844.png',
      fullPage: false,
    })

    await assertDiagnostics(page, consoleErrors, failedRequests)
  })

  test('submits the typed single-stock payload and navigates to the created product', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await openRegistration(page, identityFixture)
    const { registrations } = await mrpFixture.mockProducts({
      getResponse: {
        body: {
          items: [],
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          kpis: {},
        },
      },
      postResponse: { body: CREATED_PRODUCT, status: 201 },
    })
    await page.route('**/products/product-1/stock', async (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(STOCK_RESPONSE),
      }),
    )
    await page.route('**/products/product-1/stock-transactions**', async (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          items: [],
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
        }),
      }),
    )

    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Chocolate')
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await page.getByRole('spinbutton', { name: 'Estoque inicial' }).fill('4')
    await page.getByRole('spinbutton', { name: 'Estoque ideal' }).fill('10')
    await page.getByRole('spinbutton', { name: /Custo unitário/ }).fill('3.50')
    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect.poll(() => registrations).toHaveLength(1)
    expect(registrations[0]).toEqual({
      name: 'Chocolate',
      unit: 'un',
      categories: ['ingredient'],
      stockControl: 'single',
      allowNegativeStock: false,
      idealStock: 10,
      initialStock: 4,
      currentUnitCost: 3.5,
    })
    await expect(page).toHaveURL('/products/product-1/stock')
  })

  test('submits exactly one primary brand and derives initial stock', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await openRegistration(page, identityFixture)
    const { registrations } = await mrpFixture.mockProducts({
      getResponse: {
        body: {
          items: [],
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          kpis: {},
        },
      },
      postResponse: {
        body: { ...CREATED_PRODUCT, stockControl: 'by-brand' },
        status: 201,
      },
    })

    await page.getByRole('button', { name: 'Por marca' }).click()
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Açaí')
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await expect(page.getByRole('radio', { name: 'Marca principal 1' })).toBeVisible()
    await page.getByRole('button', { name: 'Adicionar outra marca' }).click()
    await expect(page.getByRole('radio', { name: 'Marca principal 2' })).toBeVisible()
    await page.getByPlaceholder('Ex: Frooty').nth(0).fill('Frooty')
    await page.getByPlaceholder('Ex: Frooty').nth(1).fill('Açaí Brasil')
    await page.getByRole('textbox', { name: 'Qtd. por embalagem' }).nth(0).fill('2,5')
    await page
      .getByRole('textbox', { name: 'Quantidade inicial de pacotes' })
      .nth(0)
      .fill('1,5')
    await page.getByRole('textbox', { name: 'Qtd. por embalagem' }).nth(1).fill('1')
    await page
      .getByRole('textbox', { name: 'Quantidade inicial de pacotes' })
      .nth(1)
      .fill('4')
    await page.getByRole('radio', { name: 'Marca principal 2' }).check({ force: true })
    await page.getByRole('spinbutton', { name: 'Estoque ideal' }).fill('12')
    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect.poll(() => registrations).toHaveLength(1)
    expect(registrations[0]).toEqual({
      name: 'Açaí',
      unit: 'un',
      categories: ['ingredient'],
      stockControl: 'by-brand',
      allowNegativeStock: false,
      idealStock: 12,
      initialStock: 7.75,
      brands: [
        {
          name: 'Frooty',
          unit: 'un',
          packageQuantity: 2.5,
          packageValue: 0,
          initialQuantity: 3.75,
          isPrimary: false,
        },
        {
          name: 'Açaí Brasil',
          unit: 'un',
          packageQuantity: 1,
          packageValue: 0,
          initialQuantity: 4,
          isPrimary: true,
        },
      ],
    })
  })

  test('keeps entered values after a server failure and allows recovery', async ({
    page,
    identityFixture,
  }) => {
    await openRegistration(page, identityFixture)
    let attempts = 0
    await page.route('**/products', async (route) => {
      attempts += 1
      if (attempts === 1) {
        await route.fulfill({
          contentType: 'application/json',
          status: 409,
          body: JSON.stringify({ message: 'Produto já cadastrado' }),
        })
        return
      }
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify(CREATED_PRODUCT),
      })
    })

    await page
      .getByRole('textbox', { name: 'Nome', exact: true })
      .fill('Produto existente')
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await page.getByRole('button', { name: 'Criar produto' }).click()
    await expect(page.getByRole('alert')).toContainText('Produto já cadastrado')
    await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toHaveValue(
      'Produto existente',
    )

    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Chocolate')
    await page.getByRole('button', { name: 'Criar produto' }).click()
    await expect(page).toHaveURL('/products/product-1')
  })

  test('returns to products through cancel and browser back without posting', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const { registrations } = await mrpFixture.mockProducts({
      getResponse: {
        body: {
          items: [],
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          kpis: {},
        },
      },
    })

    await page.goto('/products/new')
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/products')
    expect(registrations).toHaveLength(0)

    await page.getByRole('link', { name: /Novo produto/ }).click()
    await expect(page).toHaveURL('/products/new')
    await page.goBack()
    await expect.poll(() => new URL(page.url()).pathname).toBe('/products')
    expect(registrations).toHaveLength(0)
  })

  test('shows client validation and does not post an invalid form', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await openRegistration(page, identityFixture)
    const { registrations } = await mrpFixture.mockProducts({
      getResponse: {
        body: {
          items: [],
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          kpis: {},
        },
      },
    })

    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Sem categoria')
    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Selecione pelo menos uma categoria.',
    )
    expect(registrations).toHaveLength(0)
    await expect(page).toHaveURL('/products/new')
  })

  test('prevents duplicate submits while the create request is pending', async ({
    page,
    identityFixture,
  }) => {
    await openRegistration(page, identityFixture)
    let postCount = 0
    let releaseRequest!: () => void
    const requestReleased = new Promise<void>((resolve) => {
      releaseRequest = resolve
    })
    await page.route('**/products', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      postCount += 1
      await requestReleased
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify(CREATED_PRODUCT),
      })
    })

    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Chocolate')
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    const createButton = page.getByRole('button', { name: /Criar produto|Criando…/ })
    await createButton.click()
    await expect(createButton).toBeDisabled()

    await Promise.all([
      createButton.dispatchEvent('click'),
      createButton.dispatchEvent('click'),
    ])
    expect(postCount).toBe(1)

    releaseRequest()
    await expect(page).toHaveURL('/products/product-1')
  })
})

test.describe('New product access', () => {
  test('redirects anonymous users to login', async ({ page }) => {
    await page.goto('/products/new')
    await page.waitForURL(/\/login\?returnTo=/)
    expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/products/new')
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
  })

  test('redirects operators to access denied', async ({ page, identityFixture }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await page.goto('/products/new')
    await expect(page).toHaveURL('/access-denied')
    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
  })
})
