import { expect, test } from '../../playwright'

const combo = {
  components: [
    {
      kind: 'portion',
      productId: 'portion-1',
      quantity: 1,
      sizeId: 'size-1',
      accompanimentIds: [],
    },
    { kind: 'resale', productId: 'resale-1', quantity: 1 },
  ],
  createdAt: '2026-08-01T12:00:00.000Z',
  establishmentId: 'establishment-1',
  fixedPrice: 20,
  id: 'combo-1',
  name: 'Combo Açaí + Brownie',
  status: 'active',
  type: 'combo',
  updatedAt: '2026-08-01T12:00:00.000Z',
}

test('renders the Combo detail route and delete recovery boundary', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockManagerSession()
  await identityFixture.mockManagerAccount()
  await page.route('**/discounts/combo-1', async (route) => {
    if (route.request().resourceType() === 'document') return route.continue()
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        combo,
        components: [
          {
            component: combo.components[0],
            productName: 'Açaí',
            configurationName: '500 ml',
            accompanimentNames: [],
            unitPrice: 14,
            subtotal: 14,
            validity: 'valid',
          },
          {
            component: combo.components[1],
            productName: 'Brownie',
            configurationName: 'Preço padrão',
            accompanimentNames: [],
            unitPrice: 10,
            subtotal: 10,
            validity: 'valid',
          },
        ],
        normalPrice: 24,
        savings: 4,
      }),
    })
  })
  await page.route('**/discounts/catalog**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 }),
    })
  })
  await page.goto('/discounts/combo-1')
  await expect(page.getByRole('heading', { name: 'Editar desconto' })).toBeVisible()
  await page.getByRole('button', { name: 'Excluir' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Excluir combo?' })).toBeVisible()
})
