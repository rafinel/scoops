import { expect, test } from '@playwright/test'

import { mockAnonymousProvider } from './test-helpers'

test.describe('Reset-password route', () => {
  test('renders the invalid recovery state without protected content', async ({
    page,
  }) => {
    await mockAnonymousProvider(page)

    await page.goto('/reset-password')
    await expect(page.getByRole('alert')).toContainText('expirou ou não é válido')
    await expect(page.getByRole('textbox', { name: 'Nova senha' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Solicitar novo link' })).toBeVisible()
  })

  test('shows recovery-link validation before displaying an invalid-link state', async ({
    page,
  }) => {
    let releaseSession!: () => void
    const sessionReady = new Promise<void>((resolve) => {
      releaseSession = resolve
    })

    await page.route('**/auth/v1/session', async (route) => {
      await sessionReady
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { session: null }, error: null }),
        status: 200,
      })
    })

    const navigation = page.goto('/reset-password#type=recovery')

    await expect(page.getByRole('status')).toContainText(
      'Validando seu link de recuperação',
    )
    await expect(page.getByRole('alert')).toHaveCount(0)

    releaseSession()
    await navigation
    await expect(page.getByRole('alert')).toContainText('expirou ou não é válido')
    await expect(page.getByRole('status')).toHaveCount(0)
  })
})
