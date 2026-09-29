import { expect, test } from '../playwright'
import { accountResponse } from '../fixtures/identity-data-fixtures'

const GLOBAL_SEARCH_RESULTS = {
  pages: [{ kind: 'page', pageKey: 'salesChannels', label: 'Canais de venda' }],
  products: [
    {
      kind: 'product',
      productId: 'product-1',
      label: 'Leite integral',
      status: 'active',
    },
  ],
  orders: [
    {
      kind: 'order',
      orderId: 'order-1',
      label: '#1042',
      context: 'Ana Silva',
      status: 'registered',
    },
  ],
  users: [],
  salesChannels: [
    {
      kind: 'salesChannel',
      salesChannelId: 'channel-delivery',
      label: 'Delivery próprio',
      status: 'active',
    },
  ],
  discounts: [],
}

test.describe.configure({ mode: 'serial' })
test.describe('AccountPage', () => {
  test('captures global-search states and verifies keyboard navigation and request contract', async ({
    page,
    identityFixture,
    pdvFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await pdvFixture.mockSalesChannels()
    const requests: URL[] = []
    let releaseLoading!: () => void
    const loadingGate = new Promise<void>((resolve) => {
      releaseLoading = resolve
    })
    await page.route(/\/global-search\?q=/, async (route) => {
      const requestUrl = new URL(route.request().url())
      requests.push(requestUrl)
      const query = requestUrl.searchParams.get('q')
      if (query === 'load') await loadingGate
      if (query === 'fails') {
        await route.fulfill({
          contentType: 'application/json',
          status: 503,
          body: JSON.stringify({ message: 'temporary failure' }),
        })
        return
      }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(
          query === 'no-match'
            ? {
                pages: [],
                products: [],
                orders: [],
                users: [],
                salesChannels: [],
                discounts: [],
              }
            : query === 'keyboard'
              ? {
                  ...GLOBAL_SEARCH_RESULTS,
                  pages: [],
                  products: [
                    ...GLOBAL_SEARCH_RESULTS.products,
                    {
                      kind: 'product',
                      productId: 'product-2',
                      label: 'Calda de morango',
                      status: 'active',
                    },
                  ],
                  salesChannels: [],
                  discounts: [
                    {
                      kind: 'discount',
                      discountId: 'discount-1',
                      label: 'Combo morango',
                      status: 'active',
                    },
                  ],
                }
              : GLOBAL_SEARCH_RESULTS,
        ),
      })
    })

    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/account')
    await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible()
    const input = page.getByRole('combobox', { name: 'Buscar no Scoops' })
    await input.fill('delivery')
    await expect(page.getByRole('group', { name: 'Páginas' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Produtos' })).toBeVisible()
    await page.screenshot({ path: 'test-results/global-search/gs-desktop-header.png' })
    await expect(
      page.getByRole('option', {
        name: 'Pedido: #1042, Ana Silva · Registrado',
      }),
    ).toBeVisible()
    await expect(page.locator('[role="listbox"]').getByText('4 resultados')).toBeVisible()
    await expect(page.locator('[role="listbox"]')).toContainText('↑↓ navegar')
    await expect(page.locator('[role="listbox"]')).toContainText('Enter abrir')
    await expect(page.locator('[role="listbox"]')).toContainText('Esc fechar')
    expect(requests.at(-1)?.pathname).toBe('/global-search')
    expect(requests.at(-1)?.searchParams.get('q')).toBe('delivery')
    await page.locator('[role="listbox"]').screenshot({
      path: 'test-results/global-search/gs-desktop-results.png',
    })
    await page
      .getByRole('option', {
        name: 'Produto: Leite integral, Ativo',
      })
      .screenshot({
        path: 'test-results/global-search/gs-record-row.png',
      })

    await input.fill('load')
    await expect(page.getByRole('status', { name: 'Buscando resultados' })).toBeVisible()
    await page.locator('[role="listbox"]').screenshot({
      path: 'test-results/global-search/gs-loading.png',
    })
    releaseLoading()
    await expect(
      page.getByRole('option', { name: 'Página: Canais de venda' }),
    ).toBeVisible()

    await input.fill('no-match')
    await expect(
      page.locator('[role="listbox"]').getByText('Nenhum resultado para “no-match”', {
        exact: true,
      }),
    ).toBeVisible()
    await page.locator('[role="listbox"]').screenshot({
      path: 'test-results/global-search/gs-empty.png',
    })

    await input.fill('fails')
    await expect(page.getByRole('alert')).toContainText('A busca falhou')
    await page.locator('[role="listbox"]').screenshot({
      path: 'test-results/global-search/gs-error.png',
    })

    await input.fill('keyboard')
    await expect(
      page.getByRole('option', { name: 'Produto: Leite integral, Ativo' }),
    ).toBeVisible()
    await input.press('ArrowDown')
    await expect(
      page.getByRole('option', { name: 'Produto: Leite integral, Ativo' }),
    ).toHaveAttribute('aria-selected', 'true')
    await page.locator('[role="listbox"]').screenshot({
      path: 'test-results/global-search/gs-keyboard-focus.png',
    })
    await input.press('Escape')
    await expect(input).toBeFocused()
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/products\/product-1/)

    await page.goto('/account')
    const pageSearch = page.getByRole('combobox', { name: 'Buscar no Scoops' })
    await pageSearch.fill('delivery')
    await page.getByRole('option', { name: 'Página: Canais de venda' }).click()
    await expect(page).toHaveURL(/\/sales-channels/)
    await expect(page.getByRole('heading', { name: 'Canais de venda' })).toBeVisible()

    await page.goto('/account')
    const channelSearch = page.getByRole('combobox', { name: 'Buscar no Scoops' })
    await channelSearch.fill('delivery')
    const channelOption = page.getByRole('option', {
      name: 'Canal de venda: Delivery próprio, Ativo',
    })
    await expect(channelOption).toBeVisible()
    await channelOption.click()
    await expect(page).toHaveURL(/\/sales-channels\?search=Delivery/)
    await expect(page.getByRole('textbox', { name: 'Buscar canal' })).toHaveValue(
      'Delivery próprio',
    )
    await expect(page.getByRole('row', { name: /Delivery próprio/ })).toBeVisible()

    await page.goto('/account')
    await page.setViewportSize({ width: 320, height: 700 })
    const mobileInput = page.getByRole('combobox', { name: 'Buscar no Scoops' })
    await mobileInput.fill('delivery')
    await expect(
      page.getByRole('option', { name: 'Página: Canais de venda' }),
    ).toBeVisible()
    await page.screenshot({ path: 'test-results/global-search/gs-mobile-header.png' })
    await page.locator('[role="listbox"]').screenshot({
      path: 'test-results/global-search/gs-mobile-results.png',
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)
  })

  test('protects the route and edits the current user name', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let body: { name?: string } | undefined
    await page.route('**/auth/session/name', async (route) => {
      body = route.request().postDataJSON() as { name?: string }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(accountResponse({ name: 'Updated Browser' })),
      })
    })
    await page.goto('/account')
    await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible()
    await page.setViewportSize({ width: 1481, height: 1050 })
    await page.screenshot({
      path: 'test-results/my-account-desktop-1481x1050.png',
    })
    await page.getByRole('button', { name: 'Corrigir meu nome' }).click()
    await page.setViewportSize({ width: 676, height: 502 })
    await page.screenshot({
      path: 'test-results/my-account-name-dialog-676x502.png',
    })
    await page
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Nome completo' })
      .fill('Updated Browser')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Salvar alteração' })
      .click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(body?.name).toBe('Updated Browser')
  })

  test('redirects an anonymous visitor to login', async ({ page }) => {
    await page.goto('/account')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Faccount/)
  })

  test('keeps the account usable on mobile and retains the name after a failed save', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.route('**/auth/session/name', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 500,
        body: JSON.stringify({ message: 'Request failed' }),
      })
    })

    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/account')
    await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)

    const nameButton = page.getByRole('button', { name: 'Corrigir meu nome' })
    await nameButton.focus()
    await expect(nameButton).toBeFocused()
    await page.keyboard.press('Enter')
    const input = page.getByRole('dialog').getByRole('textbox', { name: 'Nome completo' })
    await input.fill('Nome que deve permanecer')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Salvar alteração' })
      .click()

    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
    await expect(input).toHaveValue('Nome que deve permanecer')
  })

  test('renders an authenticated Operator account without Manager-only controls', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await page.goto('/account')
    await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible()
    await expect(
      page.getByRole('list').getByText('Operador', { exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Usuários' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Sorveteria' })).toHaveCount(0)
  })

  test('shows the Manager shop settings navigation and redirects to its route', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.route('**/establishments/current', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          establishment: {
            id: 'browser-establishment-id',
            name: 'Scoops Central',
            status: 'active',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          responsibleManager: {
            id: 'browser-manager-id',
            name: 'Scoops Manager',
          },
        }),
      })
    })

    await page.goto('/account')
    const shopSettingsLink = page.getByRole('link', { name: 'Sorveteria' })
    await expect(shopSettingsLink).toHaveAttribute('href', '/shop-settings')
    await expect(shopSettingsLink).not.toHaveAttribute('aria-current', 'page')
    await shopSettingsLink.click()
    await expect(page).toHaveURL(/\/shop-settings\/?$/)
    await expect(page.getByRole('link', { name: 'Sorveteria' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('logs out the current device and returns to login', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.goto('/account')
    await page.getByRole('button', { name: 'Sair deste dispositivo' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
