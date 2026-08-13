import { expect, test } from './test-helpers'

test.describe('Login route', () => {
  test('renders login and rejects an external return destination', async ({ page }) => {
    await page.goto('/login?returnTo=https%3A%2F%2Fevil.example')

    await expect(page).toHaveURL(/\/login(?:\/?)?(?:\?.*)?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toBeVisible()
    const passwordInput = page.getByRole('textbox', { name: 'Senha' })
    const visibilityButton = page.getByRole('button', { name: 'Mostrar senha' })

    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await expect(visibilityButton).toBeVisible()
    await expect(visibilityButton).toHaveAttribute('aria-pressed', 'false')
  })
})
