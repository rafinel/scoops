import { expect, test } from '../playwright'

test.describe.configure({ mode: 'serial' })
test.describe('AppLayout', () => {
  test('redirects anonymous users with a sanitized return path', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/login\?returnTo=%2F?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toBeVisible()
    expect(await page.content()).not.toContain('Bem-vindo,')
  })

  test('keeps authenticated users in the application shell', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()

    await page.goto('/')

    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Manager Browser/ })).toBeVisible()
  })

  test('opens and dismisses the mobile navigation drawer', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.setViewportSize({ width: 375, height: 854 })
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: 'Abrir menu' })
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    const mobileNavigation = page.getByRole('dialog', { name: 'Menu principal' })
    await expect(mobileNavigation).toBeVisible()
    await expect(
      mobileNavigation.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeVisible()
    await expect(mobileNavigation.getByRole('link', { name: 'Dashboard' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(mobileNavigation).toBeHidden()
  })
})
