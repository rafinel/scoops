import { expect, test } from '../../playwright'
import { establishmentSettingsJson } from '../../fixtures/identity-data-fixtures'

test.describe('Shop settings route', () => {
  test('renders and submits the Manager settings flow', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.route('**/establishments/current', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(establishmentSettingsJson()),
      })
    })
    let body: { name?: string } | undefined
    await page.route('**/establishments/current/name', async (route) => {
      body = route.request().postDataJSON() as { name?: string }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(establishmentSettingsJson({ name: 'Scoops Jardins' })),
      })
    })
    await page.goto('/shop-settings')
    await expect(
      page.getByRole('heading', { name: 'Sorveteria', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Scoops Central', exact: true }),
    ).toBeVisible()
    await page.setViewportSize({ width: 1551, height: 1050 })
    await page.screenshot({
      path: 'test-results/shop-settings-desktop-1551x1050.png',
    })
    await page.getByRole('button', { name: 'Corrigir nome' }).click()
    await page
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Nome da loja' })
      .fill('Scoops Jardins')
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Salvar alteração' })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Scoops Jardins', exact: true }),
    ).toBeVisible()
    expect(body?.name).toBe('Scoops Jardins')
  })

  test('denies an anonymous visitor', async ({ page }) => {
    await page.goto('/shop-settings')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshop-settings/)
  })

  test('keeps the Manager settings page usable at 320px', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.route('**/establishments/current', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(establishmentSettingsJson()),
      })
    })

    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/shop-settings')
    await expect(
      page.getByRole('heading', { name: 'Sorveteria', exact: true }),
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)
    const nameButton = page.getByRole('button', { name: 'Corrigir nome' })
    await nameButton.focus()
    await expect(nameButton).toBeFocused()
  })

  test('denies an authenticated Operator', async ({ page, identityFixture }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await page.route('**/establishments/current', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 403,
        body: JSON.stringify({ message: 'Forbidden' }),
      })
    })
    await page.goto('/login')
    const forbiddenResponse = await page.evaluate(async () => {
      const response = await fetch('/establishments/current')
      return response.status
    })
    expect(forbiddenResponse).toBe(403)
    await page.goto('/shop-settings')
    await expect(page).toHaveURL(/\/access-denied/)
    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
  })
})
