import { expect, test } from '@playwright/test'

import { mockAnonymousProvider } from './test-helpers'

test.describe('Forgot-password route', () => {
  test('renders the recovery form with accessible fields and a pending-safe action', async ({
    page,
  }) => {
    await mockAnonymousProvider(page)

    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: 'Recupere seu acesso' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'autocomplete',
      'email',
    )
    await expect(page.getByRole('button', { name: 'Enviar instruções' })).toBeEnabled()
    await expect(page.getByRole('link', { name: 'Voltar para entrar' })).toBeVisible()
  })
})
