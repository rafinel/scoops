import { expect, test } from '../playwright'

test('denies Operators access to discount creation', async ({ page, identityFixture }) => {
  await identityFixture.mockOperatorSession()
  await identityFixture.mockOperatorAccount()
  await page.goto('/discounts/new')
  await expect(page).toHaveURL('/access-denied')
  await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
})

test('renders the Combo create page for a Manager', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await page.route('**/discounts/catalog**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 }),
    })
  })
  await page.goto('/discounts/new')
  await expect(page.getByRole('heading', { name: 'Adicionar desconto' })).toBeVisible()
  await expect(page.getByLabel('Nome do combo')).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar produto' }).click()
  const productDialog = page.getByRole('dialog', { name: 'Adicionar produto' })
  await expect(productDialog).toBeVisible()
  const portionsFilter = productDialog.getByRole('button', { name: 'Porções' })
  await portionsFilter.click()
  await expect(portionsFilter).toHaveAttribute('aria-pressed', 'true')
  await expect(portionsFilter).toHaveClass(/bg-primary/)
  await expect(productDialog.getByRole('button', { name: 'Todos' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

test('configures a single-stock resale product with its seeded default price', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await page.route('**/discounts/catalog**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            productId: 'resale-cup',
            name: 'Copo 300 ml',
            kind: 'resale',
            stockControl: 'single',
            isActive: true,
            isAvailable: true,
            sizes: [],
            resalePrice: 4.5,
            resaleBrands: [],
          },
        ],
        page: 1,
        pageSize: 50,
        total: 1,
        totalPages: 1,
      }),
    })
  })

  await page.goto('/discounts/new')
  await page.getByRole('button', { name: 'Adicionar produto' }).click()
  const productDialog = page.getByRole('dialog', { name: 'Adicionar produto' })
  await productDialog.getByRole('button', { name: 'Revendas' }).click()
  await productDialog.getByRole('button', { name: 'Copo 300 ml' }).click()
  await expect(productDialog.getByText('Sem marca: R$ 4,50')).toBeVisible()
  await expect(
    productDialog.getByRole('button', { name: 'Adicionar produto' }),
  ).toBeEnabled()
})

test('selects one active resale brand with checkbox controls', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await page.route('**/discounts/catalog**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            productId: 'resale-oat-cream',
            name: 'Creme de aveia',
            kind: 'resale',
            stockControl: 'single',
            isActive: true,
            isAvailable: true,
            sizes: [],
            resalePrice: 32.5,
            resaleBrands: [
              {
                brandId: 'brand-nutella',
                name: 'Nutella',
                basePrice: 75,
                isActive: true,
                isAvailable: true,
              },
              {
                brandId: 'brand-aveia',
                name: 'Aveia',
                basePrice: 62.86,
                isActive: true,
                isAvailable: true,
              },
            ],
          },
        ],
        page: 1,
        pageSize: 50,
        total: 1,
        totalPages: 1,
      }),
    })
  })

  await page.goto('/discounts/new')
  await page.getByRole('button', { name: 'Adicionar produto' }).click()
  const productDialog = page.getByRole('dialog', { name: 'Adicionar produto' })
  await productDialog.getByRole('button', { name: 'Revendas' }).click()
  await productDialog.getByRole('button', { name: 'Creme de aveia' }).click()

  const nutellaCheckbox = productDialog.getByRole('checkbox', { name: /Nutella/ })
  const aveiaCheckbox = productDialog.getByRole('checkbox', { name: /Aveia/ })
  await expect(nutellaCheckbox).toBeVisible()
  await expect(aveiaCheckbox).toBeVisible()
  await expect(nutellaCheckbox).toHaveAttribute('aria-checked', 'false')
  await expect(aveiaCheckbox).toHaveAttribute('aria-checked', 'false')

  await nutellaCheckbox.check()
  await expect(nutellaCheckbox).toHaveAttribute('aria-checked', 'true')
  await expect(aveiaCheckbox).toHaveAttribute('aria-checked', 'false')

  await aveiaCheckbox.check()
  await expect(nutellaCheckbox).toHaveAttribute('aria-checked', 'false')
  await expect(aveiaCheckbox).toHaveAttribute('aria-checked', 'true')
})

test('configures a portion product with its active filter state', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await page.route('**/discounts/catalog**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            productId: 'portion-acai',
            name: 'Açaí 500 ml',
            kind: 'portion',
            stockControl: 'single',
            isActive: true,
            isAvailable: true,
            sizes: [
              {
                sizeId: 'portion-acai-500',
                name: '500 ml',
                quantity: 500,
                basePrice: 14,
                isActive: true,
                isAvailable: true,
                accompaniments: [],
              },
            ],
            resaleBrands: [],
          },
        ],
        page: 1,
        pageSize: 50,
        total: 1,
        totalPages: 1,
      }),
    })
  })

  await page.goto('/discounts/new')
  await page.getByRole('button', { name: 'Adicionar produto' }).click()
  const productDialog = page.getByRole('dialog', { name: 'Adicionar produto' })
  const portionsFilter = productDialog.getByRole('button', { name: 'Porções' })
  await portionsFilter.click()
  await expect(portionsFilter).toHaveClass(/bg-primary/)
  await productDialog.getByRole('button', { name: 'Açaí 500 ml' }).click()
  await expect(productDialog.getByRole('button', { name: /500 ml R\$ 14,00/ })).toBeVisible()
  await productDialog.getByRole('button', { name: '500 ml R$ 14,00' }).click()
  await productDialog.getByRole('button', { name: 'Adicionar produto' }).click()

  const removeButton = page.getByRole('button', { name: 'Remover Açaí 500 ml' })
  await removeButton.click()
  const removalDialog = page.getByRole('alertdialog', {
    name: 'Remover produto do Combo?',
  })
  await expect(removalDialog).toContainText(
    'O produto Açaí 500 ml será removido da composição.',
  )
  await removalDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(removeButton).toBeVisible()

  await removeButton.click()
  await page
    .getByRole('alertdialog', { name: 'Remover produto do Combo?' })
    .getByRole('button', { name: 'Remover produto' })
    .click()
  await expect(removeButton).toHaveCount(0)
  await expect(page.getByText('Nenhum produto adicionado.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adicionar produto' })).toBeFocused()
})

for (const viewport of [
  { width: 1481, height: 1050, name: 'desktop' },
  { width: 390, height: 844, name: 'narrow' },
]) {
  test(`reveals disabled picker rows for a search and keeps them unselectable at ${viewport.name} viewport`, async ({
    page,
    identityFixture,
  }) => {
    const diagnostics: string[] = []
    const catalogQueries: URLSearchParams[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') diagnostics.push(message.text())
    })
    page.on('requestfailed', (request) => diagnostics.push(request.url()))
    const availableProduct = {
      productId: 'portion-acai',
      name: 'Açaí tradicional',
      kind: 'portion',
      stockControl: 'single',
      isActive: true,
      isAvailable: true,
      availability: 'available',
      sizes: [
        {
          sizeId: 'portion-acai-500',
          name: '500 ml',
          quantity: 500,
          basePrice: 14,
          isActive: true,
          isAvailable: true,
          accompaniments: [],
        },
      ],
      resaleBrands: [],
    }
    const outOfStockProduct = {
      productId: 'resale-out-of-stock',
      name: 'Pote de açaí 1 L',
      kind: 'resale',
      stockControl: 'single',
      isActive: true,
      isAvailable: false,
      availability: 'out_of_stock',
      sizes: [],
      resalePrice: 28,
      resaleBrands: [],
    }
    const missingPriceProduct = {
      ...outOfStockProduct,
      productId: 'resale-missing-price',
      name: 'Pote de açaí 500 ml',
      availability: 'missing_price',
      resalePrice: undefined,
    }
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.setViewportSize(viewport)
    await page.route('**/discounts/catalog**', async (route) => {
      const query = new URL(route.request().url()).searchParams
      catalogQueries.push(query)
      const items = query.get('search')
        ? [availableProduct, outOfStockProduct, missingPriceProduct]
        : [availableProduct]
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          items,
          page: 1,
          pageSize: 50,
          total: items.length,
          totalPages: 1,
        }),
      })
    })

    await page.goto('/discounts/new')
    await page.getByRole('button', { name: 'Adicionar produto' }).click()
    const productDialog = page.getByRole('dialog', { name: 'Adicionar produto' })
    await expect(productDialog.getByRole('button', { name: /Açaí tradicional/ })).toBeVisible()
    await expect(productDialog.getByText('Sem estoque')).toHaveCount(0)
    await expect(productDialog.getByText('Sem preço', { exact: true })).toHaveCount(0)

    const requestsBeforeSearch = catalogQueries.length
    await productDialog
      .getByRole('textbox', { name: 'Buscar produtos' })
      .pressSequentially('  açaí ', { delay: 40 })
    const outOfStockRow = productDialog.getByRole('button', { name: /Pote de açaí 1 L/ })
    const missingPriceRow = productDialog.getByRole('button', { name: /Pote de açaí 500 ml/ })
    await expect(outOfStockRow).toBeVisible()
    expect(
      catalogQueries.slice(requestsBeforeSearch).map((query) => query.get('search')),
    ).toEqual(['açaí'])
    await expect(outOfStockRow).toHaveAttribute('aria-disabled', 'true')
    await expect(outOfStockRow).not.toHaveAttribute('aria-pressed', /.*/)
    await expect(outOfStockRow).toHaveAccessibleDescription('Sem estoque')
    await expect(missingPriceRow).toHaveAccessibleDescription('Sem preço')
    await expect(outOfStockRow).toContainText('Sem estoque')
    await expect(missingPriceRow).toContainText('Sem preço')

    const emptyConfiguration = productDialog.getByText('Selecione um produto para configurar.')
    await outOfStockRow.click({ force: true })
    await expect(emptyConfiguration).toBeVisible()
    await missingPriceRow.focus()
    await expect(missingPriceRow).toBeFocused()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await expect(emptyConfiguration).toBeVisible()
    await expect(missingPriceRow).toBeFocused()
    await expect(missingPriceRow).not.toHaveAttribute('aria-pressed', /.*/)
    await expect(
      productDialog.getByRole('button', { name: 'Adicionar produto' }),
    ).toBeDisabled()

    await productDialog.getByRole('button', { name: /Açaí tradicional/ }).click()
    await expect(
      productDialog.getByRole('heading', { name: 'Açaí tradicional' }),
    ).toBeVisible()
    await outOfStockRow.click({ force: true })
    await expect(
      productDialog.getByRole('heading', { name: 'Açaí tradicional' }),
    ).toBeVisible()

    const requestsBeforeClear = catalogQueries.length
    await productDialog.getByRole('textbox', { name: 'Buscar produtos' }).fill('')
    await expect(outOfStockRow).toHaveCount(0)
    expect(
      catalogQueries.slice(requestsBeforeClear).map((query) => query.get('search')),
    ).toEqual([null])
    expect(diagnostics).toEqual([])
  })
}
