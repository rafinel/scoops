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

const PRODUCTS_RESPONSE = {
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

test.describe('Products route', () => {
  test('protects the route and preserves requested search state', async ({ page }) => {
    await page.goto('/products?search=milk&page=2')
    await page.waitForURL(/\/login\?returnTo=/)
    await expect(page).toHaveURL(/\/login\?returnTo=/)
    expect(new URL(page.url()).searchParams.get('returnTo')).toContain('search=milk')
    expect(new URL(page.url()).searchParams.get('returnTo')).toContain('page=2')
  })

  test('renders catalog, synchronizes search, opens registration, and captures desktop evidence', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { requests } = await mrp.mockProducts({
      getResponse: { body: PRODUCTS_RESPONSE },
      postResponse: { body: PRODUCT, status: 201 },
    })

    await page.setViewportSize({ width: 1481, height: 1450 })
    await navigateToProducts(page)
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
    await expect(page.getByText('Leite integral')).toBeVisible()
    await expect(page.getByText('Estoque baixo')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Registrado em/ })).toBeVisible()
    await expect(page.getByText('17/08/2026', { exact: true })).toBeVisible()
    const kpiCards = page.locator('[data-slot="card"]')
    await expect(kpiCards.nth(0)).toContainText('22')
    await expect(kpiCards.nth(1)).toContainText('7')
    await expect(kpiCards.nth(2)).toContainText('4')
    const productSortButton = page.getByRole('button', { name: 'Ordenar por Produto' })
    await expect(productSortButton).toBeVisible()
    await expect(productSortButton).toHaveAttribute('aria-label', 'Ordenar por Produto')
    await expect(page.getByRole('columnheader', { name: /Produto/ })).toHaveAttribute(
      'aria-sort',
      'none',
    )
    await productSortButton.click()
    await expect(page).toHaveURL(/sortBy=name&sortDirection=asc/)
    await expect.poll(() => requests.at(-1)?.searchParams.get('sortBy')).toBe('name')
    await expect
      .poll(() => requests.at(-1)?.searchParams.get('sortDirection'))
      .toBe('asc')
    await expect(page.getByRole('columnheader', { name: /Produto/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await productSortButton.click()
    await expect(page).toHaveURL(/sortBy=name&sortDirection=desc/)
    await expect
      .poll(() => requests.at(-1)?.searchParams.get('sortDirection'))
      .toBe('desc')
    await expect(page.getByRole('columnheader', { name: /Produto/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    await page.setViewportSize({ width: 1481, height: 1450 })
    await page.screenshot({
      path: 'test-results/products-catalog-1481x1450.png',
    })
    const kpiRailStyles = await page.locator('[data-slot="card"]').evaluateAll((cards) =>
      cards.slice(0, 3).map((card) => {
        const style = getComputedStyle(card)
        return {
          borderLeftColor: style.borderLeftColor,
          borderLeftWidth: style.borderLeftWidth,
        }
      }),
    )
    expect(kpiRailStyles).toEqual([
      { borderLeftColor: 'rgb(109, 40, 217)', borderLeftWidth: '4px' },
      { borderLeftColor: 'rgb(30, 64, 175)', borderLeftWidth: '4px' },
      { borderLeftColor: 'rgb(220, 38, 38)', borderLeftWidth: '4px' },
    ])
    const categoryChip = page.getByText('Ingrediente', { exact: true }).first()
    await expect(categoryChip).toHaveCSS('height', '24px')
    await expect(categoryChip).toHaveCSS('padding-left', '10px')
    await expect(categoryChip).toHaveCSS('padding-top', '4px')

    const searchInput = page.getByRole('textbox', { name: 'Buscar produtos' })
    await searchInput.fill('milk')
    await expect(page).toHaveURL(/search=milk/)
    await expect.poll(() => requests.at(-1)?.searchParams.get('search')).toBe('milk')
    await expect(kpiCards.nth(0)).toContainText('22')
    await expect(kpiCards.nth(1)).toContainText('7')
    await expect(kpiCards.nth(2)).toContainText('4')
    const focusStyles = await searchInput.evaluate((element) => {
      const inputStyle = getComputedStyle(element)
      const wrapperStyle = getComputedStyle(element.closest('label') as HTMLElement)

      return {
        inputBorderWidth: inputStyle.borderWidth,
        inputOutlineWidth: inputStyle.outlineWidth,
        inputShadowHasVisibleDimensions:
          inputStyle.boxShadow !== 'none' &&
          inputStyle.boxShadow
            .split('),')
            .some((shadow) => !shadow.includes('0px 0px 0px 0px')),
        wrapperBoxShadow: wrapperStyle.boxShadow,
      }
    })
    expect(focusStyles.inputBorderWidth).toBe('0px')
    expect(focusStyles.inputShadowHasVisibleDimensions).toBe(false)
    expect(focusStyles.inputOutlineWidth).toBe('0px')
    expect(focusStyles.wrapperBoxShadow).not.toBe('none')

    await page.getByRole('button', { name: /Novo produto/ }).click()
    await expect(page.getByRole('dialog', { name: 'Novo produto' })).toBeVisible()
    await expect(
      page.getByText('Informe o saldo disponível no início do controle.'),
    ).toBeVisible()
    const registrationDialog = page.getByRole('dialog', { name: 'Novo produto' })
    await registrationDialog.getByRole('button', { name: 'Criar produto' }).click()
    const productNameInput = registrationDialog.getByRole('textbox', {
      name: 'Nome do produto',
    })
    await expect(productNameInput).toHaveAttribute(
      'aria-describedby',
      'product-name-error',
    )
    await expect(productNameInput).toHaveAttribute('aria-invalid', 'true')
    await expect(
      registrationDialog.getByText('Informe o nome do produto.', { exact: true }),
    ).toBeVisible()
    await expect(
      registrationDialog.getByText('Selecione pelo menos uma categoria.', {
        exact: true,
      }),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/products-registration-field-errors-1481x1450.png',
      fullPage: true,
    })
    await productNameInput.fill('Leite integral')
    await registrationDialog.getByRole('checkbox').first().check()
    const allowNegativeStockCheckbox = registrationDialog.getByRole('checkbox', {
      name: 'Permitir estoque negativo',
    })
    await expect(allowNegativeStockCheckbox).not.toBeChecked()
    await registrationDialog
      .getByText('Permitir estoque negativo', { exact: true })
      .click()
    await expect(allowNegativeStockCheckbox).toBeChecked()
    await page.screenshot({
      path: 'test-results/products-registration-negative-stock-1481x1450.png',
      fullPage: true,
    })
    await expect(
      registrationDialog.getByText('Informe o nome do produto.', { exact: true }),
    ).toBeHidden()
    await expect(
      registrationDialog.getByText('Selecione pelo menos uma categoria.', {
        exact: true,
      }),
    ).toBeHidden()
    const portionCheckbox = registrationDialog.getByRole('checkbox', {
      name: 'Porção',
    })
    const resaleCheckbox = registrationDialog.getByRole('checkbox', {
      name: 'Revenda',
    })
    await portionCheckbox.check()
    await expect(resaleCheckbox).toBeDisabled()
    await expect(
      registrationDialog.getByText('Porção e Revenda não podem ser selecionadas juntas.'),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/products-category-exclusion-1481x1450.png',
      fullPage: true,
    })
    await portionCheckbox.uncheck()
    await resaleCheckbox.check()
    await expect(portionCheckbox).toBeDisabled()
    await resaleCheckbox.uncheck()
    await registrationDialog.getByRole('button', { name: 'Por marca' }).click()
    await expect(
      registrationDialog.getByRole('heading', { name: 'Marcas do produto' }),
    ).toBeVisible()
    await expect(
      registrationDialog.getByRole('textbox', { name: 'Nome', exact: true }),
    ).toHaveCSS('height', '40px')
    await expect(
      registrationDialog
        .getByRole('spinbutton', { name: 'Qtd. por embalagem' })
        .locator('..'),
    ).toHaveCSS('height', '40px')
    await expect(
      registrationDialog.getByRole('spinbutton', { name: 'Quantidade de embalagens' }),
    ).toHaveCSS('height', '40px')
    await expect(
      registrationDialog.getByRole('checkbox', { name: 'Marca principal' }),
    ).toBeChecked()
    await registrationDialog
      .getByRole('spinbutton', { name: 'Qtd. por embalagem' })
      .fill('2')
    await registrationDialog
      .getByRole('spinbutton', { name: 'Quantidade de embalagens' })
      .fill('3')
    await expect(
      registrationDialog.getByRole('spinbutton', { name: 'Estoque inicial' }),
    ).toHaveValue('6')
    await registrationDialog.getByRole('button', { name: 'Estoque único' }).click()
    await registrationDialog.getByRole('checkbox', { name: 'Fabricável' }).check()
    await expect(
      registrationDialog.getByRole('button', { name: 'Por marca' }),
    ).toBeDisabled()
    await expect(
      registrationDialog.getByText('Produtos fabricáveis usam estoque único.'),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/products-category-constraints-1481x1450.png',
      fullPage: true,
    })
  })

  test('supports filters, keyboard focus, retry, and narrow viewport evidence', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    await mrp.mockProducts({
      getResponse: (_request, requestNumber) =>
        requestNumber === 1
          ? { body: { message: 'unavailable' }, status: 503 }
          : { body: PRODUCTS_RESPONSE },
    })
    await page.setViewportSize({ width: 320, height: 900 })
    await navigateToProducts(page)
    await expect(page.getByText('Não foi possível carregar os produtos.')).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Leite integral')).toBeVisible()
    await page.getByRole('button', { name: /Filtros/ }).focus()
    await expect(page.getByRole('button', { name: /Filtros/ })).toBeFocused()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: 'test-results/products-responsive-320x900.png',
      fullPage: true,
    })
  })

  test('keeps global KPIs stable when search changes the product list', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { requests } = await mrp.mockProducts({
      getResponse: (request) => ({
        body:
          request.searchParams.get('search') === 'morango'
            ? {
                ...PRODUCTS_RESPONSE,
                items: [],
                totalItems: 0,
                totalPages: 1,
              }
            : PRODUCTS_RESPONSE,
      }),
    })

    await page.setViewportSize({ width: 1481, height: 900 })
    await navigateToProducts(page)
    const kpiCards = page.locator('[data-slot="card"]')
    await expect(page.getByText('Leite integral')).toBeVisible()
    await expect(kpiCards.nth(0)).toContainText('22')
    await expect(kpiCards.nth(1)).toContainText('7')
    await expect(kpiCards.nth(2)).toContainText('4')

    await page.getByRole('textbox', { name: 'Buscar produtos' }).fill('morango')

    await expect(page.getByText('Leite integral')).toBeHidden()
    await expect(page.getByText('Nenhum produto encontrado')).toBeVisible()
    await expect(kpiCards.nth(0)).toContainText('22')
    await expect(kpiCards.nth(1)).toContainText('7')
    await expect(kpiCards.nth(2)).toContainText('4')
    await expect.poll(() => requests).toHaveLength(2)
    expect(requests.map((request) => request.pathname)).toEqual([
      '/products',
      '/products',
    ])
    expect(requests.at(-1)?.searchParams.get('search')).toBe('morango')
    await page.screenshot({
      fullPage: true,
      path: 'test-results/products-filtered-global-kpis-1481x900.png',
    })
  })

  test('keeps long product names inside their column on narrow screens', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    await mrp.mockProducts({
      getResponse: {
        body: {
          ...PRODUCTS_RESPONSE,
          items: [
            {
              ...PRODUCTS_RESPONSE.items[0],
              product: {
                ...PRODUCT,
                name: 'Produto estoque E2E 178707060123456789',
              },
            },
          ],
        },
      },
    })

    await page.setViewportSize({ width: 371, height: 900 })
    await navigateToProducts(page)

    const row = page.getByRole('row').nth(1)
    const productCell = row.getByRole('cell').nth(0)
    const categoryCell = row.getByRole('cell').nth(1)
    const productName = productCell.locator('[title]').first()
    const productNameBox = await productName.boundingBox()
    const categoryCellBox = await categoryCell.boundingBox()

    expect(productNameBox).not.toBeNull()
    expect(categoryCellBox).not.toBeNull()
    expect((productNameBox?.x ?? 0) + (productNameBox?.width ?? 0)).toBeLessThanOrEqual(
      categoryCellBox?.x ?? 0,
    )
    await page.screenshot({
      fullPage: true,
      path: 'test-results/products-long-name-371x900.png',
    })
  })

  test('uses primary color for stock and status filter selections', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { requests } = await mrp.mockProducts({
      getResponse: { body: PRODUCTS_RESPONSE },
    })

    await page.setViewportSize({ width: 1481, height: 900 })
    await navigateToProducts(page)
    await page.getByRole('button', { name: /Filtros/ }).click()
    const filtersDialog = page.getByRole('dialog', { name: 'Filtrar produtos' })
    const normalFilter = filtersDialog.getByRole('button', { name: 'Normal' })
    const activeFilter = filtersDialog.getByRole('button', { name: 'Ativo', exact: true })

    await normalFilter.click()
    await activeFilter.click()
    await expect(normalFilter).toHaveAttribute('aria-pressed', 'true')
    await expect(activeFilter).toHaveAttribute('aria-pressed', 'true')

    for (const filter of [normalFilter, activeFilter]) {
      await expect(filter).toHaveCSS('color', 'rgb(109, 40, 217)')
      await expect(filter).toHaveCSS('background-color', 'rgb(237, 233, 254)')
    }

    await page.screenshot({
      path: 'test-results/products-filter-primary-selection-1481x900.png',
      fullPage: true,
    })
    await page.setViewportSize({ width: 677, height: 601 })
    await page.screenshot({
      path: 'test-results/products-filters-677x601.png',
    })
    await filtersDialog.getByRole('button', { name: 'Aplicar filtros' }).click()
    await expect
      .poll(() => new URL(page.url()).searchParams.get('stockSituation'))
      .toBe('normal')
    await expect.poll(() => new URL(page.url()).searchParams.get('status')).toBe('active')
    await expect
      .poll(() => requests.at(-1)?.searchParams.get('stockSituation'))
      .toBe('normal')
    await expect.poll(() => requests.at(-1)?.searchParams.get('status')).toBe('active')
  })

  test('sorts every product column and resets pagination', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { requests } = await mrp.mockProducts({
      getResponse: { body: PRODUCTS_RESPONSE },
    })

    await page.setViewportSize({ width: 1481, height: 900 })
    await navigateToProducts(page, '/products?sortBy=createdAt&sortDirection=desc&page=3')
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()

    const columns = [
      { field: 'name', label: 'Produto' },
      { field: 'categories', label: 'Categorias' },
      { field: 'unit', label: 'Un.' },
      { field: 'brandCount', label: 'Marcas' },
      { field: 'stockQuantity', label: 'Estoque' },
      { field: 'createdAt', label: 'Registrado em' },
    ] as const

    for (const { field, label } of columns) {
      const sortButton = page.getByRole('button', { name: `Ordenar por ${label}` })
      await expect(sortButton).toBeVisible()
      await sortButton.focus()
      await expect(sortButton).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(
        new RegExp(`sortBy=${field}&sortDirection=asc.*page=1`),
      )
      await expect.poll(() => requests.at(-1)?.searchParams.get('sortBy')).toBe(field)
      await expect
        .poll(() => requests.at(-1)?.searchParams.get('sortDirection'))
        .toBe('asc')
      await expect(
        page.getByRole('columnheader', { name: new RegExp(label) }),
      ).toHaveAttribute('aria-sort', 'ascending')
    }
  })

  test('distinguishes empty catalog states and clears active filters', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { requests } = await mrp.mockProducts({
      getResponse: {
        body: {
          ...PRODUCTS_RESPONSE,
          items: [],
          totalItems: 0,
          totalPages: 1,
        },
      },
    })

    await navigateToProducts(page)
    await expect(page.getByText('Seu catálogo está vazio')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Limpar filtros' })).toHaveCount(0)

    await navigateToProducts(page, '/products?search=milk')
    await expect(page.getByText('Nenhum produto encontrado')).toBeVisible()
    await expect(
      page.getByText('Tente ajustar os filtros para encontrar outros produtos.'),
    ).toBeVisible()
    await expect.poll(() => requests.at(-1)?.searchParams.get('search')).toBe('milk')
    await page.getByRole('button', { name: 'Limpar filtros' }).click()
    await expect(page).not.toHaveURL(/search=milk/)
    await expect(page.getByText('Seu catálogo está vazio')).toBeVisible()
  })

  test('creates a product with single stock control', async ({ page, identity, mrp }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { registrations } = await mrp.mockProducts({
      getResponse: { body: PRODUCTS_RESPONSE },
      postResponse: {
        body: { ...PRODUCT, name: 'Sorvete de morango' },
        status: 201,
      },
    })

    await navigateToProducts(page)
    await page.getByRole('button', { name: /Novo produto/ }).click()
    const registrationDialog = page.getByRole('dialog', { name: 'Novo produto' })
    await registrationDialog
      .getByRole('textbox', { name: 'Nome do produto' })
      .fill('Sorvete de morango')
    await registrationDialog.getByRole('combobox', { name: 'Unidade de estoque' }).click()
    await page.getByRole('option', { name: 'Litros (l)' }).click()
    await registrationDialog.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await registrationDialog.getByRole('spinbutton', { name: 'Estoque ideal' }).fill('20')
    await registrationDialog
      .getByRole('spinbutton', { name: 'Estoque inicial' })
      .fill('5')
    await registrationDialog
      .getByText('Permitir estoque negativo', { exact: true })
      .click()
    await page.setViewportSize({ width: 708, height: 826 })
    await page.screenshot({
      path: 'test-results/products-registration-single-708x826.png',
    })
    await registrationDialog.getByRole('button', { name: 'Criar produto' }).click()

    await expect(registrationDialog).toBeHidden()
    await expect
      .poll(() => registrations)
      .toEqual([
        {
          name: 'Sorvete de morango',
          unit: 'l',
          categories: ['ingredient'],
          stockControl: 'single',
          allowNegativeStock: true,
          idealStock: 20,
          initialStock: 5,
        },
      ])
  })

  test('creates a product with by-brand stock control and calculated initial stock', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { registrations } = await mrp.mockProducts({
      getResponse: { body: PRODUCTS_RESPONSE },
      postResponse: {
        body: { ...PRODUCT, name: 'Açaí Frooty' },
        status: 201,
      },
    })

    await navigateToProducts(page)
    await page.getByRole('button', { name: /Novo produto/ }).click()
    const registrationDialog = page.getByRole('dialog', { name: 'Novo produto' })
    await registrationDialog
      .getByRole('textbox', { name: 'Nome do produto' })
      .fill('Açaí Frooty')
    await registrationDialog.getByRole('checkbox', { name: 'Ingrediente' }).check()
    await registrationDialog.getByRole('button', { name: 'Por marca' }).click()
    await registrationDialog
      .getByRole('textbox', { name: 'Nome', exact: true })
      .fill('Frooty')
    await registrationDialog
      .getByRole('spinbutton', { name: 'Qtd. por embalagem' })
      .fill('2')
    await registrationDialog
      .getByRole('textbox', { name: 'Valor por embalagem' })
      .fill('12,50')
    await registrationDialog
      .getByRole('spinbutton', { name: 'Quantidade de embalagens' })
      .fill('3')
    await expect(
      registrationDialog.getByRole('spinbutton', { name: 'Estoque inicial' }),
    ).toHaveValue('6')
    await registrationDialog.getByRole('spinbutton', { name: 'Estoque ideal' }).fill('10')
    await page.setViewportSize({ width: 727, height: 1240 })
    await page.screenshot({
      path: 'test-results/products-registration-by-brand-727x1240.png',
    })
    await registrationDialog.getByRole('button', { name: 'Criar produto' }).click()

    await expect(registrationDialog).toBeHidden()
    await expect
      .poll(() => registrations)
      .toEqual([
        {
          name: 'Açaí Frooty',
          unit: 'un',
          categories: ['ingredient'],
          stockControl: 'by-brand',
          allowNegativeStock: false,
          idealStock: 10,
          initialStock: 6,
          brands: [
            {
              name: 'Frooty',
              packageQuantity: 2,
              packageValue: 12.5,
              initialQuantity: 6,
            },
          ],
        },
      ])
  })
})

async function navigateToProducts(page: Page, url = '/products') {
  const productsResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname === '/products',
  )
  await page.goto(url)
  await (await productsResponse).finished()
  await page.getByRole('heading', { name: 'Produtos' }).waitFor()
}
