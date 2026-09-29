import { expect, test } from '../playwright'

test.describe('Subscription route', () => {
  test('allows a Manager to open the page', async ({ page, identityFixture }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.goto('/subscription')
    await expect(page).toHaveURL(/\/subscription\/?$/)
    await expect(page.getByRole('heading', { name: 'Assinatura' })).toBeVisible()
  })

  test('redirects anonymous visitors to login', async ({ page }) => {
    await page.goto('/subscription')
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fsubscription/)
  })

  test('denies Operators direct access', async ({ page, identityFixture }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await page.goto('/subscription')
    await expect(page).toHaveURL(/\/access-denied$/)
    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
  })
})
