import { expect, test } from '../../playwright'

test.describe('Forgot-password route', () => {
  test('renders the recovery form with accessible fields and a pending-safe action', async ({
    page,
  }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: 'Recupere seu acesso' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'autocomplete',
      'email',
    )
    await expect(page.getByRole('button', { name: 'Enviar instruções' })).toBeEnabled()
    await expect(page.getByRole('link', { name: 'Voltar para entrar' })).toBeVisible()
  })

  test('shows client-side validation and lets the user start over', async ({ page }) => {
    let recoveryRequests = 0
    await page.route('**/registration-attempts/password-recovery*', async (route) => {
      recoveryRequests += 1
      await route.fulfill({ status: 200, body: '{}' })
    })

    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')
    const email = page.getByRole('textbox', { name: 'Email' })

    await email.fill('person@example')
    await email.evaluate((input) => {
      const form = input.closest('form')
      if (form) form.noValidate = true
    })
    await page.getByRole('button', { name: 'Enviar instruções' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Informe um email válido para continuar.',
    )
    expect(recoveryRequests).toBe(0)

    await email.fill('person@example.com')
    await page.getByRole('button', { name: 'Enviar instruções' }).click()
    await expect(page.getByRole('status')).toContainText('Confira seu email')

    await page.getByRole('button', { name: 'Tentar com outro email' }).click()
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(
      'person@example.com',
    )
    await expect(page.getByRole('button', { name: 'Enviar instruções' })).toBeVisible()
    await email.fill('another@example.com')
    await expect(email).toHaveValue('another@example.com')
    expect(recoveryRequests).toBe(1)
  })

  test('keeps the success state neutral when the provider rejects the request', async ({
    page,
  }) => {
    let requestBody: { email?: string } | undefined
    await page.route('**/registration-attempts/password-recovery*', async (route) => {
      requestBody = route.request().postDataJSON() as { email?: string }
      await route.fulfill({
        contentType: 'application/json',
        status: 500,
        body: JSON.stringify({ message: 'Provider unavailable' }),
      })
    })

    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'Email' }).fill('person@example.com')
    await page.getByRole('button', { name: 'Enviar instruções' }).click()

    await expect(page.getByRole('status')).toContainText('Confira seu email')
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(requestBody?.email).toBe('person@example.com')
  })

  test('disables the recovery form while the provider request is pending', async ({
    page,
  }) => {
    let releaseRecovery!: () => void
    const recoveryReady = new Promise<void>((resolve) => {
      releaseRecovery = resolve
    })
    await page.route('**/registration-attempts/password-recovery*', async (route) => {
      await recoveryReady
      await route.fulfill({ status: 200, body: '{}' })
    })

    await page.goto('/forgot-password')
    await page.waitForLoadState('networkidle')
    const email = page.getByRole('textbox', { name: 'Email' })
    await email.fill('person@example.com')
    await page.getByRole('button', { name: 'Enviar instruções' }).click()

    await expect(page.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
    await expect(email).toBeDisabled()

    releaseRecovery()
    await expect(page.getByRole('status')).toContainText('Confira seu email')
  })
})
