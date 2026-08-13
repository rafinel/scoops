import { expect, test } from './test-helpers'

test.describe('App route', () => {
  test('redirects anonymous users with a sanitized return path', async ({ page }) => {
    await page.goto('/app')

    await expect(page).toHaveURL(/\/login\/?(?:\?returnTo=%2Fapp)?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toBeVisible()
    expect(await page.content()).not.toContain('Bem-vindo,')
  })
})
