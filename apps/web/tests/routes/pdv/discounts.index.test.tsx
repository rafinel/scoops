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

test.describe('Discounts list route', () => {
  test('protects the Manager route and renders the list and chooser', async ({
    page,
  }) => {
    await page.goto('/discounts')
    await page.waitForURL(/\/login\?returnTo=/)
    await expect(page).toHaveURL(/\/login\?returnTo=/)
  })

  test('renders a Manager list and opens the Combo type chooser', async ({
    page,
    identityFixture,
  }) => {
    const consoleErrors: string[] = []
    const failedRequests: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(
        `${request.url()} — ${request.failure()?.errorText ?? 'failed'}`,
      )
    })
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.setViewportSize({ height: 1050, width: 1481 })
    await page.route('**/discounts?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
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
            },
          ],
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        }),
      })
    })
    await page.goto('/discounts')
    await expect(
      page.getByRole('heading', { name: 'Descontos', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Combo Açaí + Brownie').first()).toBeVisible()
    const typeFilter = page.getByRole('combobox', { name: 'Filtrar por tipo' })
    const statusFilter = page.getByRole('combobox', { name: 'Filtrar por status' })
    await expect(typeFilter).toContainText('Todos')
    await expect(statusFilter).toContainText('Todos')

    await typeFilter.click()
    await page.getByRole('option', { name: 'Combo' }).click()
    await expect(typeFilter).toContainText('Combo')
    await expect.poll(() => new URL(page.url()).searchParams.get('type')).toBe('combo')

    await statusFilter.click()
    await page.getByRole('option', { name: 'Ativo', exact: true }).click()
    await expect(statusFilter).toContainText('Ativo')
    await expect.poll(() => new URL(page.url()).searchParams.get('status')).toBe('active')
    await page.screenshot({
      path: 'test-results/combo-runtime-list-populated-1481x1050.png',
    })

    await page.setViewportSize({ height: 844, width: 390 })
    const searchControl = page.locator('label[for="discount-search"]')
    const filtersHeader = searchControl.locator(
      'xpath=ancestor::div[@data-slot="card-header"]',
    )
    const availableFiltersWidth = await filtersHeader.evaluate((element) => {
      const styles = window.getComputedStyle(element)
      return (
        element.clientWidth -
        Number.parseFloat(styles.paddingLeft) -
        Number.parseFloat(styles.paddingRight)
      )
    })
    const [searchBox, typeBox, statusBox] = await Promise.all([
      searchControl.boundingBox(),
      typeFilter.boundingBox(),
      statusFilter.boundingBox(),
    ])
    expect(searchBox).not.toBeNull()
    expect(typeBox).not.toBeNull()
    expect(statusBox).not.toBeNull()
    if (!searchBox || !typeBox || !statusBox) {
      throw new Error('Expected visible discount filter controls')
    }
    expect(Math.abs(searchBox.width - availableFiltersWidth)).toBeLessThanOrEqual(1)
    expect(Math.abs(typeBox.width - availableFiltersWidth)).toBeLessThanOrEqual(1)
    expect(Math.abs(statusBox.width - availableFiltersWidth)).toBeLessThanOrEqual(1)
    expect(typeBox.y).toBeGreaterThan(searchBox.y + searchBox.height)
    expect(statusBox.y).toBeGreaterThan(typeBox.y + typeBox.height)
    await page.screenshot({
      path: 'test-results/combo-runtime-list-mobile-filters-390x844.png',
    })
    await page.getByRole('textbox', { name: 'Buscar descontos' }).focus()
    await page.keyboard.press('Tab')
    await expect(typeFilter).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(statusFilter).toBeFocused()

    await page.getByRole('button', { name: 'Criar desconto' }).click()
    await expect(page.getByRole('dialog', { name: 'Criar desconto' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Combo/ })).toBeVisible()
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })
})
