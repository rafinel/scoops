import { expect, test } from '../../playwright'

test.describe('Access-denied route', () => {
  test('renders the access-denied state', async ({ page }) => {
    await page.goto('/access-denied')

    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
    await expect(page.getByText('Acesso restrito')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Voltar para o início' }),
    ).toHaveAttribute('href', '/')
  })

  test('returns to the login boundary when navigating to the protected home route', async ({
    page,
  }) => {
    await page.goto('/access-denied')
    await page.getByRole('link', { name: 'Voltar para o início' }).click()

    await expect(page).toHaveURL(/\/login\?returnTo=%2F?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
  })
})
