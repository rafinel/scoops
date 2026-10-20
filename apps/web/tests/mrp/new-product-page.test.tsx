import type { Page } from '@playwright/test'

import type { IdentityModuleFixture } from '../fixtures/identity-module-fixture'
import { expect, test } from '../playwright'

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

test.describe('NewProductPage', () => {
  test('covers the single-stock desktop and narrow states with keyboard focus', async ({
    page,
    identityFixture,
  }) => {
    const { consoleErrors, failedRequests } = addDiagnostics(page)
    await openRegistration(page, identityFixture)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await expect(page.getByRole('button', { name: 'Criar produto' })).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    const nameInput = page.getByRole('textbox', { name: 'Nome', exact: true })
    await nameInput.focus()
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('placeholder')),
    ).toBe('Ex: Polpa de Açaí')

    await assertDiagnostics(page, consoleErrors, failedRequests)
  })

  test('covers the by-brand desktop and narrow states without clipping', async ({
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
    await page.getByRole('heading', { name: 'Estoque' }).scrollIntoViewIfNeeded()
    await page
      .getByText('Total calculado pelas quantidades iniciais das marcas.')
      .scrollIntoViewIfNeeded()

    await page.setViewportSize({ width: 390, height: 844 })
    const createButton = page.getByRole('button', { name: 'Criar produto' })
    await createButton.scrollIntoViewIfNeeded()
    await expect(createButton).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
    await page.getByRole('radio', { name: 'Marca principal 2' }).focus()
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
    ).toBe('Marca principal 2')

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

  test('shows the sale price fields by category and stock control and restores hidden values', async ({
    page,
    identityFixture,
  }) => {
    const { consoleErrors, failedRequests } = addDiagnostics(page)
    await openRegistration(page, identityFixture)
    const resalePrice = page.getByRole('textbox', { name: 'Preço de revenda' })
    const accompanimentPrice = page.getByRole('textbox', {
      name: 'Preço como acompanhamento',
    })

    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await expect(resalePrice).toHaveCount(0)
    await expect(accompanimentPrice).toHaveCount(0)

    await page.getByRole('checkbox', { name: 'Revenda' }).check()
    await expect(resalePrice).toBeVisible()
    await expect(resalePrice).toHaveAttribute('placeholder', '0,00')
    await expect(
      page.getByText('Opcional. Sem preço, o produto fica indisponível no PDV.'),
    ).toBeVisible()
    await expect(accompanimentPrice).toHaveCount(0)
    await resalePrice.fill('12,50')

    await page.getByRole('checkbox', { name: 'Acompanhamento' }).check()
    await expect(accompanimentPrice).toBeVisible()
    await expect(accompanimentPrice).toHaveValue('')

    await page.getByRole('checkbox', { name: 'Revenda' }).uncheck()
    await expect(resalePrice).toHaveCount(0)
    await page.getByRole('checkbox', { name: 'Revenda' }).check()
    await expect(resalePrice).toHaveValue('12,50')

    await page.getByRole('button', { name: 'Por marca' }).click()
    await expect(resalePrice).toHaveCount(0)
    await expect(accompanimentPrice).toHaveCount(0)
    await page.getByRole('button', { name: 'Estoque único' }).click()
    await expect(resalePrice).toHaveValue('12,50')

    await assertDiagnostics(page, consoleErrors, failedRequests)
  })

  test('does not validate or send prices typed into fields that are hidden again', async ({
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
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Paçoca')
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await page.getByRole('checkbox', { name: 'Revenda' }).check()
    await page.getByRole('checkbox', { name: 'Acompanhamento' }).check()
    await page.getByRole('textbox', { name: 'Preço de revenda' }).fill('12,50')
    await page.getByRole('textbox', { name: 'Preço como acompanhamento' }).fill('-1')
    await page.getByRole('checkbox', { name: 'Revenda' }).uncheck()
    await page.getByRole('checkbox', { name: 'Acompanhamento' }).uncheck()

    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect.poll(() => registrations).toHaveLength(1)
    expect(registrations[0]).not.toHaveProperty('resalePrice')
    expect(registrations[0]).not.toHaveProperty('accompanimentPrice')
    expect(registrations[0]).toMatchObject({ categories: ['ingredient'] })
    await expect(page).toHaveURL('/products/product-1/stock')
  })

  test('lays the price fields side by side on desktop and stacks them on narrow screens', async ({
    page,
    identityFixture,
  }) => {
    const { consoleErrors, failedRequests } = addDiagnostics(page)
    await openRegistration(page, identityFixture)
    await page.getByRole('checkbox', { name: 'Revenda' }).check()
    await page.getByRole('checkbox', { name: 'Acompanhamento' }).check()
    const resalePrice = page.getByRole('textbox', { name: 'Preço de revenda' })
    const accompanimentPrice = page.getByRole('textbox', {
      name: 'Preço como acompanhamento',
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    const desktopResale = await resalePrice.boundingBox()
    const desktopAccompaniment = await accompanimentPrice.boundingBox()
    expect(
      Math.abs((desktopResale?.y ?? 0) - (desktopAccompaniment?.y ?? 1)),
    ).toBeLessThan(2)
    expect(desktopAccompaniment?.x ?? 0).toBeGreaterThan(desktopResale?.x ?? 0)

    await page.setViewportSize({ width: 390, height: 844 })
    const narrowResale = await resalePrice.boundingBox()
    const narrowAccompaniment = await accompanimentPrice.boundingBox()
    expect(narrowAccompaniment?.y ?? 0).toBeGreaterThan(narrowResale?.y ?? 0)
    expect(Math.abs((narrowResale?.x ?? 0) - (narrowAccompaniment?.x ?? 1))).toBeLessThan(
      2,
    )

    await assertDiagnostics(page, consoleErrors, failedRequests)
  })

  test('shows a price error beside the field and does not post an invalid price', async ({
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
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Paçoca')
    await page.getByRole('checkbox', { name: 'Revenda' }).check()
    await page.getByRole('checkbox', { name: 'Acompanhamento' }).check()
    await page.getByRole('textbox', { name: 'Preço de revenda' }).fill('12,00')
    const accompanimentPrice = page.getByRole('textbox', {
      name: 'Preço como acompanhamento',
    })
    await accompanimentPrice.fill('-1')

    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect(
      page.getByText(
        'Informe um preço maior ou igual a zero, com até duas casas decimais.',
      ),
    ).toBeVisible()
    await expect(accompanimentPrice).toHaveAttribute('aria-invalid', 'true')
    await expect(accompanimentPrice).toHaveValue('-1')
    await expect(page.getByRole('textbox', { name: 'Preço de revenda' })).toHaveValue(
      '12,00',
    )
    expect(registrations).toHaveLength(0)
  })

  test('submits the typed prices as numbers and navigates to the created product', async ({
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

    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Paçoca')
    await page.getByRole('checkbox', { name: 'Revenda' }).check()
    await page.getByRole('checkbox', { name: 'Acompanhamento' }).check()
    await page.getByRole('textbox', { name: 'Preço de revenda' }).fill('12,00')
    await page.getByRole('textbox', { name: 'Preço como acompanhamento' }).fill('0')
    await page.getByRole('spinbutton', { name: 'Estoque inicial' }).fill('10')
    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect.poll(() => registrations).toHaveLength(1)
    expect(registrations[0]).toEqual({
      name: 'Paçoca',
      unit: 'un',
      categories: ['resale', 'accompaniment'],
      stockControl: 'single',
      allowNegativeStock: false,
      idealStock: 0,
      initialStock: 10,
      resalePrice: 12,
      accompanimentPrice: 0,
    })
    await expect(page).toHaveURL('/products/product-1/stock')
  })

  test('keeps the typed prices and shows the page alert when the server rejects the registration', async ({
    page,
    identityFixture,
  }) => {
    await openRegistration(page, identityFixture)
    const bodies: unknown[] = []
    await page.route('**/products', async (route) => {
      bodies.push(route.request().postDataJSON())
      await route.fulfill({
        contentType: 'application/json',
        status: 400,
        body: JSON.stringify({
          message:
            'O preço de revenda é permitido apenas para produtos de revenda com estoque único.',
        }),
      })
    })
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Paçoca')
    await page.getByRole('checkbox', { name: 'Revenda' }).check()
    await page.getByRole('textbox', { name: 'Preço de revenda' }).fill('12,00')

    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'O preço de revenda é permitido apenas para produtos de revenda com estoque único.',
    )
    await expect(page.getByRole('textbox', { name: 'Preço de revenda' })).toHaveValue(
      '12,00',
    )
    expect(bodies).toEqual([expect.objectContaining({ resalePrice: 12 })])
    await expect(page).toHaveURL('/products/new')
  })

  test('shows the sizes section only for Portion, between the Catálogo and Estoque cards, and restores hidden rows', async ({
    page,
    identityFixture,
  }) => {
    await openRegistration(page, identityFixture)
    const sizes = page.getByRole('heading', { name: 'Tamanhos e preços' })
    await expect(sizes).toBeHidden()

    await page.getByRole('checkbox', { name: 'Porção' }).check()
    await expect(sizes).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nome do tamanho 1' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nome do tamanho 2' })).toBeHidden()
    await expect(page.getByRole('textbox', { name: 'Preço de revenda' })).toBeHidden()
    const positions = await page
      .getByRole('heading', { level: 2 })
      .evaluateAll((headings) => headings.map((heading) => heading.textContent))
    expect(positions.indexOf('Catálogo')).toBeLessThan(
      positions.indexOf('Tamanhos e preços'),
    )
    expect(positions.indexOf('Tamanhos e preços')).toBeLessThan(
      positions.indexOf('Estoque'),
    )

    await page.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await page.getByRole('textbox', { name: 'Nome do tamanho 2' }).fill('Grande')
    await page.getByRole('button', { name: 'Remover tamanho 1' }).click()
    await expect(page.getByRole('textbox', { name: 'Nome do tamanho 2' })).toBeHidden()
    await expect(page.getByRole('textbox', { name: 'Nome do tamanho 1' })).toHaveValue(
      'Grande',
    )

    await page.getByRole('checkbox', { name: 'Porção' }).uncheck()
    await expect(sizes).toBeHidden()
    await page.getByRole('checkbox', { name: 'Porção' }).check()
    await expect(page.getByRole('textbox', { name: 'Nome do tamanho 1' })).toHaveValue(
      'Grande',
    )
    await page.getByRole('button', { name: 'Por marca' }).click()
    await expect(sizes).toBeVisible()
  })

  test('shows size row errors beside the fields and does not post an invalid row', async ({
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
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Açaí')
    await page.getByRole('checkbox', { name: 'Porção' }).check()
    await page.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await page.getByRole('textbox', { name: 'Nome do tamanho 1' }).fill('Médio')
    await page.getByRole('textbox', { name: 'Quantidade do tamanho 1' }).fill('0,5')
    await page.getByRole('textbox', { name: 'Preço do tamanho 1' }).fill('9,90')
    await page.getByRole('textbox', { name: 'Nome do tamanho 2' }).fill(' médio ')

    await page.getByRole('button', { name: 'Criar produto' }).click()

    const quantity = page.getByRole('textbox', { name: 'Quantidade do tamanho 2' })
    await expect(quantity).toHaveAttribute('aria-invalid', 'true')
    await expect(
      page.getByText(
        'Informe uma quantidade maior que zero, com até três casas decimais.',
      ),
    ).toBeVisible()
    await expect(
      page.getByText('Informe um preço válido, com até duas casas decimais.'),
    ).toBeVisible()
    await expect(page.getByText('Já existe um tamanho com esse nome.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nome do tamanho 2' })).toHaveValue(
      ' médio ',
    )
    await expect(page.getByRole('textbox', { name: 'Preço do tamanho 1' })).toHaveValue(
      '9,90',
    )
    expect(registrations).toHaveLength(0)
  })

  test('submits the typed sizes as numbers, ignores empty rows and navigates to the created product', async ({
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

    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Açaí')
    await page.getByRole('checkbox', { name: 'Porção' }).check()
    await page.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await page.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await page.getByRole('textbox', { name: 'Nome do tamanho 1' }).fill('Pequeno')
    await page.getByRole('textbox', { name: 'Quantidade do tamanho 1' }).fill('0,3')
    await page.getByRole('textbox', { name: 'Preço do tamanho 1' }).fill('9,90')
    await page.getByRole('textbox', { name: 'Nome do tamanho 3' }).fill('Grande')
    await page.getByRole('textbox', { name: 'Quantidade do tamanho 3' }).fill('0.5')
    await page.getByRole('textbox', { name: 'Preço do tamanho 3' }).fill('14.50')
    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect.poll(() => registrations).toHaveLength(1)
    expect(registrations[0]).toMatchObject({
      categories: ['portion'],
      sizes: [
        { name: 'Pequeno', quantity: 0.3, price: 9.9 },
        { name: 'Grande', quantity: 0.5, price: 14.5 },
      ],
    })
    await expect(page).toHaveURL('/products/product-1/stock')
  })

  test('does not validate or send size rows typed while Portion is unselected', async ({
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
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Açaí')
    await page.getByRole('checkbox', { name: 'Porção' }).check()
    await page.getByRole('textbox', { name: 'Nome do tamanho 1' }).fill('Pequeno')
    await page.getByRole('checkbox', { name: 'Porção' }).uncheck()
    await page.getByRole('checkbox', { name: 'Ingrediente' }).check()

    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect.poll(() => registrations).toHaveLength(1)
    expect(registrations[0]).not.toHaveProperty('sizes')
    await expect(page).toHaveURL('/products/product-1/stock')
  })

  test('keeps the typed sizes and shows the page alert when the server rejects the registration', async ({
    page,
    identityFixture,
  }) => {
    await openRegistration(page, identityFixture)
    const bodies: unknown[] = []
    await page.route('**/products', async (route) => {
      bodies.push(route.request().postDataJSON())
      await route.fulfill({
        contentType: 'application/json',
        status: 400,
        body: JSON.stringify({
          message: 'Já existe um tamanho com esse nome para o produto.',
        }),
      })
    })
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Açaí')
    await page.getByRole('checkbox', { name: 'Porção' }).check()
    await page.getByRole('textbox', { name: 'Nome do tamanho 1' }).fill('Pequeno')
    await page.getByRole('textbox', { name: 'Quantidade do tamanho 1' }).fill('1')
    await page.getByRole('textbox', { name: 'Preço do tamanho 1' }).fill('5')

    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Já existe um tamanho com esse nome para o produto.',
    )
    await expect(page.getByRole('textbox', { name: 'Nome do tamanho 1' })).toHaveValue(
      'Pequeno',
    )
    expect(bodies).toEqual([
      expect.objectContaining({ sizes: [{ name: 'Pequeno', quantity: 1, price: 5 }] }),
    ])
    await expect(page).toHaveURL('/products/new')
  })

  test('lays the size row fields on one line on desktop and stacks them on narrow screens', async ({
    page,
    identityFixture,
  }) => {
    const { consoleErrors, failedRequests } = addDiagnostics(page)
    await openRegistration(page, identityFixture)
    await page.getByRole('checkbox', { name: 'Porção' }).check()
    const fields = page.getByRole('group', { name: 'Tamanho 1' }).locator('label')
    await expect(fields).toHaveCount(3)

    await page.setViewportSize({ width: 1440, height: 900 })
    const wide = await fields.evaluateAll((labels) =>
      labels.map((label) => label.getBoundingClientRect().top),
    )
    expect(Math.max(...wide) - Math.min(...wide)).toBeLessThanOrEqual(1)
    await assertDiagnostics(page, consoleErrors, failedRequests)

    await page.setViewportSize({ width: 390, height: 844 })
    const narrow = await fields.evaluateAll((labels) =>
      labels.map((label) => {
        const { left, top } = label.getBoundingClientRect()
        return { left, top }
      }),
    )
    expect(new Set(narrow.map(({ left }) => Math.round(left))).size).toBe(1)
    expect(narrow[0]?.top ?? 0).toBeLessThan(narrow[1]?.top ?? 0)
    expect(narrow[1]?.top ?? 0).toBeLessThan(narrow[2]?.top ?? 0)
    await assertDiagnostics(page, consoleErrors, failedRequests)
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

  test('denies Operators direct product registration access', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await page.goto('/products/new')
    await expect(page).toHaveURL('/access-denied')
    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Novo produto' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Salvar produto' })).toHaveCount(0)
  })
})

if (process.env.SCOOPS_PLAYWRIGHT_ANALYTICS_FIXTURE === '1') {
  test.describe('analytics', () => {
    test.use({
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
    })

    test('retries a sanitized completion without repeating product creation', async ({
      page,
      identityFixture,
      mrpFixture,
      analyticsTransportFixture,
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
      await page.addInitScript(() => {
        Object.defineProperties(Navigator.prototype, {
          webdriver: { configurable: true, get: () => false },
          userAgentData: { configurable: true, get: () => undefined },
        })
      })
      await page.goto('/products/new')
      await expect(page.getByRole('heading', { name: 'Novo produto' })).toBeVisible()
      await expect
        .poll(() => analyticsTransportFixture.eventAttempts('$identify').length)
        .toBeGreaterThan(0)
      analyticsTransportFixture.failOnceForEvent('workflow_completed')

      await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Chocolate')
      await page.getByRole('checkbox', { name: 'Ingrediente' }).check()
      await page.getByRole('spinbutton', { name: 'Estoque inicial' }).fill('4')
      await page.getByRole('spinbutton', { name: 'Estoque ideal' }).fill('10')
      await page.getByRole('spinbutton', { name: /Custo unitário/ }).fill('3.50')
      await page.getByRole('button', { name: 'Criar produto' }).click()

      await expect(page).toHaveURL('/products/product-1/stock')
      await expect.poll(() => registrations).toHaveLength(1)
      await expect
        .poll(() => analyticsTransportFixture.eventAttempts('workflow_completed').length)
        .toBeGreaterThanOrEqual(2)

      const [failedAttempt, retryAttempt] =
        analyticsTransportFixture.eventAttempts('workflow_completed')
      expect(failedAttempt).toBeDefined()
      expect(retryAttempt).toBeDefined()
      const failedProperties = failedAttempt?.properties
      expect(failedProperties).toBeDefined()
      expect(retryAttempt).toMatchObject({
        uuid: failedAttempt?.uuid,
        timestamp: failedAttempt?.timestamp,
        properties: {
          distinct_id:
            typeof failedProperties === 'object' && failedProperties !== null
              ? (failedProperties as Record<string, unknown>).distinct_id
              : undefined,
          workflow: 'product_creation',
          workflow_id:
            typeof failedProperties === 'object' && failedProperties !== null
              ? (failedProperties as Record<string, unknown>).workflow_id
              : undefined,
          establishment_id: 'browser-establishment-id',
          role: 'manager',
        },
      })

      const persistedKeys = await page.evaluate(() => [
        ...Array.from({ length: window.localStorage.length }, (_, index) =>
          window.localStorage.key(index),
        ),
        ...Array.from({ length: window.sessionStorage.length }, (_, index) =>
          window.sessionStorage.key(index),
        ),
      ])
      expect(persistedKeys.filter(Boolean).join('\n')).not.toMatch(/posthog|event.queue/i)
    })
  })
}
