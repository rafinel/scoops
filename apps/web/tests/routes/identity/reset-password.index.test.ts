import { expect, test } from '../../playwright'

const RESET_PASSWORD = 'password123'

test.describe('Reset-password route', () => {
  test('renders the invalid recovery state without protected content', async ({
    page,
  }) => {
    await page.goto('/reset-password')

    await expect(page.getByRole('alert')).toContainText('expirou ou não é válido')
    await expect(page.getByRole('textbox', { name: 'Nova senha' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Solicitar novo link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  test('shows recovery-link validation before displaying an invalid-link state', async ({
    page,
  }) => {
    let releaseSession!: () => void
    const sessionReady = new Promise<void>((resolve) => {
      releaseSession = resolve
    })

    await page.route('**/auth/v1/session*', async (route) => {
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

  test('validates password length and confirmation before transport', async ({
    page,
    identity,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    let updateRequests = 0
    await page.route('**/auth/v1/user*', async (route) => {
      updateRequests += 1
      await route.continue()
    })

    await page.goto('/reset-password#type=recovery')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('short')
    await page.getByRole('textbox', { name: 'Confirmar nova senha' }).fill('short')
    await page.getByRole('button', { name: 'Atualizar senha' }).click()

    await expect(page.getByRole('alert')).toContainText('entre 8 e 64 caracteres')
    expect(updateRequests).toBe(0)
  })

  test('rejects mismatched confirmation before transport', async ({ page, identity }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    let updateRequests = 0
    await page.route('**/auth/v1/user*', async (route) => {
      updateRequests += 1
      await route.continue()
    })

    await page.goto('/reset-password#type=recovery')
    await page.waitForLoadState('networkidle')
    await page
      .getByRole('textbox', { name: 'Nova senha', exact: true })
      .fill(RESET_PASSWORD)
    await page.getByRole('textbox', { name: 'Confirmar nova senha' }).fill('different123')
    await page.getByRole('button', { name: 'Atualizar senha' }).click()

    await expect(page.getByRole('alert')).toContainText('As senhas precisam ser iguais.')
    expect(updateRequests).toBe(0)
  })

  test('updates a valid password and redirects to login', async ({ page, identity }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    let updateBody: { password?: string } | undefined
    let logoutRequests = 0
    await page.route('**/auth/v1/user*', async (route) => {
      updateBody = route.request().postDataJSON() as { password?: string }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({ user: { id: 'browser-manager-id' } }),
      })
    })
    await page.route('**/auth/v1/logout*', async (route) => {
      logoutRequests += 1
      await route.fulfill({ status: 204, body: '' })
    })

    await page.goto('/reset-password#type=recovery')
    await page.waitForLoadState('networkidle')
    await page
      .getByRole('textbox', { name: 'Nova senha', exact: true })
      .fill(RESET_PASSWORD)
    await page.getByRole('textbox', { name: 'Confirmar nova senha' }).fill(RESET_PASSWORD)
    await page.getByRole('button', { name: 'Atualizar senha' }).click()

    await expect(page).toHaveURL(/\/login\/?$/)
    expect(updateBody?.password).toBe(RESET_PASSWORD)
    expect(logoutRequests).toBe(1)
  })

  test('keeps the reset form available after a provider failure', async ({
    page,
    identity,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    await page.route('**/auth/v1/user*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 500,
        body: JSON.stringify({ message: 'Password provider unavailable' }),
      })
    })

    await page.goto('/reset-password#type=recovery')
    await page.waitForLoadState('networkidle')
    await page
      .getByRole('textbox', { name: 'Nova senha', exact: true })
      .fill(RESET_PASSWORD)
    await page.getByRole('textbox', { name: 'Confirmar nova senha' }).fill(RESET_PASSWORD)
    await page.getByRole('button', { name: 'Atualizar senha' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível atualizar sua senha',
    )
    await expect(
      page.getByRole('textbox', { name: 'Nova senha', exact: true }),
    ).toBeVisible()
  })

  test('toggles both password visibility controls', async ({ page, identity }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    await page.goto('/reset-password#type=recovery')
    await page.waitForLoadState('networkidle')
    const password = page.getByRole('textbox', { name: 'Nova senha', exact: true })
    const confirmation = page.getByRole('textbox', { name: 'Confirmar nova senha' })

    await expect(password).toHaveAttribute('type', 'password')
    await expect(confirmation).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Mostrar senha' }).first().click()
    await page.getByRole('button', { name: 'Mostrar senha' }).last().click()
    await expect(password).toHaveAttribute('type', 'text')
    await expect(confirmation).toHaveAttribute('type', 'text')
  })
})
