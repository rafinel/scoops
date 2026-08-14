import { expect, test } from './test-helpers'

test.describe('Onboarding confirmation route', () => {
  test('renders a safe recovery state for a missing confirmation token', async ({
    page,
  }) => {
    let confirmationRequests = 0
    await page.route('**/registration-attempts/onboarding/confirm', async (route) => {
      confirmationRequests += 1
      await route.continue()
    })

    await page.goto('/onboarding/confirm')

    await expect(page).toHaveURL(/\/onboarding\/confirm\/?$/)
    await expect(
      page.getByRole('heading', { name: 'Não foi possível confirmar' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Começar novamente' })).toBeVisible()
    expect(confirmationRequests).toBe(0)
  })

  test('rejects malformed confirmation tokens before transport', async ({ page }) => {
    let confirmationRequests = 0
    await page.route('**/registration-attempts/onboarding/confirm', async (route) => {
      confirmationRequests += 1
      await route.continue()
    })

    await page.goto('/onboarding/confirm?confirmationToken=not-a-token')

    await expect(
      page.getByRole('heading', { name: 'Não foi possível confirmar' }),
    ).toBeVisible()
    expect(confirmationRequests).toBe(0)
  })
})
