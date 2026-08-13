import { expect, test } from './test-helpers'

test.describe('Ice cream shop onboarding route', () => {
  test('renders the registration form and its five credential controls', async ({
    page,
  }) => {
    await page.goto('/onboarding')

    await expect(page).toHaveURL(/\/onboarding\/?$/)
    await expect(page.getByRole('heading', { name: 'Crie sua sorveteria' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nome da sorveteria' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Seu nome' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toBeVisible()
    await expect(
      page.getByRole('textbox', { name: 'Senha', exact: true }),
    ).toHaveAttribute('autocomplete', 'new-password')
    await expect(page.getByRole('textbox', { name: 'Confirme sua senha' })).toBeVisible()
  })

  test('shows validation without sending a registration request', async ({ page }) => {
    let registrationRequests = 0
    await page.route('**/registration-attempts/onboarding', async (route) => {
      registrationRequests += 1
      await route.continue()
    })
    await page.goto('/onboarding')
    const submit = page.getByRole('button', { name: 'Criar sorveteria' })
    await expect(submit).toBeEnabled()
    await page.waitForLoadState('networkidle')
    await submit.click()

    await expect(page.getByRole('alert')).toContainText('Preencha os dados')
    expect(registrationRequests).toBe(0)
  })
})
