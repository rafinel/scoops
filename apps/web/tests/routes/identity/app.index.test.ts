import { expect, test } from '../../playwright'

test.describe('Authenticated app route', () => {
  test('redirects anonymous users with a sanitized return path', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/login\?returnTo=%2F?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toBeVisible()
    expect(await page.content()).not.toContain('Bem-vindo,')
  })

  test('keeps authenticated users in the application shell', async ({
    page,
    identity,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()

    await page.goto('/')

    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Manager Browser/ })).toBeVisible()
  })
})
