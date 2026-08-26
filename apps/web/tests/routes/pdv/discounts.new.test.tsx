import { expect, test } from '../../playwright'

test('renders the Combo create route for a Manager', async ({
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
  await productDialog.screenshot({
    path: 'test-results/pdv/combo-product-filter-primary-portion.png',
  })
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
  await productDialog.screenshot({
    path: 'test-results/pdv/combo-product-resale-single-price.png',
  })
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
  await productDialog.screenshot({
    path: 'test-results/pdv/combo-product-brand-checkboxes.png',
  })
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
  await productDialog.screenshot({
    path: 'test-results/pdv/combo-product-portion-active-filter.png',
  })
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
  await removalDialog.screenshot({
    path: 'test-results/pdv/combo-product-removal-confirmation.png',
  })
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
