import { expect, test } from '../../playwright'
import { accountResponse } from '../../fixtures/identity-data-fixtures'

test.describe('Account route', () => {
  test('protects the route and edits the current user name', async ({
    page,
    identity,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
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
      path: '../../documentation/features/identity/features/profile-and-ice-cream-settings/evidence/screenshots/rev-3/my-account-desktop-1481x1050.png',
    })
    await page.getByRole('button', { name: 'Corrigir meu nome' }).click()
    await page.setViewportSize({ width: 676, height: 502 })
    await page.screenshot({
      path: '../../documentation/features/identity/features/profile-and-ice-cream-settings/evidence/screenshots/rev-3/my-account-name-dialog-676x502.png',
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
    identity,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
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
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    )

    const nameButton = page.getByRole('button', { name: 'Corrigir meu nome' })
    await nameButton.focus()
    await expect(nameButton).toBeFocused()
    await page.keyboard.press('Enter')
    const input = page.getByRole('dialog').getByRole('textbox', { name: 'Nome completo' })
    await input.fill('Nome que deve permanecer')
    await page.getByRole('dialog').getByRole('button', { name: 'Salvar alteração' }).click()

    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible()
    await expect(input).toHaveValue('Nome que deve permanecer')
  })

  test('renders an authenticated Operator account without Manager-only controls', async ({
    page,
    identity,
  }) => {
    await identity.mockOperatorSession()
    await identity.mockOperatorAccount()
    await page.goto('/account')
    await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible()
    await expect(page.getByRole('list').getByText('Operador', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Usuários' })).toHaveCount(0)
  })

  test('logs out the current device and returns to login', async ({ page, identity }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    await page.goto('/account')
    await page.getByRole('button', { name: 'Sair deste dispositivo' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
