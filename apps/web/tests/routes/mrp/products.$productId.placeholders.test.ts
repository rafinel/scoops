import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { expect, test } from '../../playwright'

const PRODUCT_ID = 'product-placeholder-1'
const PRODUCT = ProductFaker.fake({
  id: PRODUCT_ID,
  establishmentId: 'establishment-1',
  name: 'Produto placeholder',
  unit: 'un',
  categories: ['ingredient'],
  stockControl: 'single',
  status: 'active',
})

const PLACEHOLDER_ROUTES = [
  { categories: ['portion'], path: 'accompaniments', tab: 'Acompanhamentos' },
  { categories: ['resale'], path: 'prices', tab: 'Preços' },
  { categories: ['ingredient'], path: 'settings', tab: 'Configurações' },
] as const

test.describe('Product details placeholder routes', () => {
  for (const { categories, path, tab } of PLACEHOLDER_ROUTES) {
    test(`renders the ${tab} placeholder tab`, async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await identityFixture.mockManagerSession()
      await identityFixture.mockManagerAccount()
      const product = { ...PRODUCT, categories }
      await mrpFixture.mockProductStock({
        respond: () => ({
          body: {
            brands: [],
            idealStock: 0,
            product,
            stockQuantity: 0,
            stockSituation: 'normal',
          },
        }),
      })

      await page.goto(`/products/${PRODUCT_ID}/${path}`)

      await expect(page).toHaveURL(`/products/${PRODUCT_ID}/${path}`)
      await expect(page.getByRole('heading', { name: product.name })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Estoque' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Configurações' })).toBeVisible()
      if (categories[0] === 'portion') {
        await expect(page.getByRole('tab', { name: 'Acompanhamentos' })).toBeVisible()
        await expect(page.getByRole('tab', { name: 'Preços' })).toBeVisible()
      }
      if (categories[0] === 'resale') {
        await expect(page.getByRole('tab', { name: 'Preços' })).toBeVisible()
        await expect(page.getByRole('tab', { name: 'Acompanhamentos' })).toHaveCount(0)
      }
      if (categories[0] === 'ingredient') {
        await expect(page.getByRole('tab', { name: 'Acompanhamentos' })).toHaveCount(0)
        await expect(page.getByRole('tab', { name: 'Preços' })).toHaveCount(0)
      }
      await expect(page.getByRole('tab', { name: 'Receita' })).toHaveCount(0)
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      await expect(page.getByRole('heading', { name: tab, exact: true })).toBeVisible()
      await expect(page.getByText('Em breve', { exact: true })).toBeVisible()
      if (path === 'accompaniments') {
        await page.screenshot({
          fullPage: true,
          path: 'test-results/products-details-tabs-placeholder-1280x900.png',
        })
      }
    })
  }

  test('redirects an unavailable category tab to Stock', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: () => ({
        body: {
          brands: [],
          idealStock: 0,
          product: PRODUCT,
          stockQuantity: 0,
          stockSituation: 'normal',
        },
      }),
    })

    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)

    await expect(page).toHaveURL(`/products/${PRODUCT_ID}/stock`)
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Acompanhamentos' })).toHaveCount(0)
  })
})
