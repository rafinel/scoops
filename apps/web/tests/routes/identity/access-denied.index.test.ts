import { expect, test } from './test-helpers'

test.describe('Access-denied route', () => {
  test('renders the access-denied state', async ({ page }) => {
    await page.goto('/access-denied')

    await expect(page.getByRole('heading', { name: 'Acesso negado' })).toBeVisible()
    await expect(page.getByText('Acesso restrito')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Voltar para o início' }),
    ).toHaveAttribute('href', '/')
  })
})
