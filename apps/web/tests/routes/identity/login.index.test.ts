import { expect, test } from '../../playwright'

const LOGIN_CREDENTIALS = {
  email: 'manager@example.com',
  password: 'password123',
}

const AUTH_SESSION = {
  user: { id: 'browser-manager-id', email: LOGIN_CREDENTIALS.email },
  session: { id: 'better-auth-session-id' },
}

test.describe('Login route', () => {
  test('renders accessible credentials and rejects an external return destination', async ({
    page,
  }) => {
    await page.goto('/login?returnTo=https%3A%2F%2Fevil.example')

    await expect(page).toHaveURL(/\/login(?:\/?)?(?:\?.*)?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute(
      'autocomplete',
      'email',
    )
    const passwordInput = page.getByRole('textbox', { name: 'Senha' })
    const visibilityButton = page.getByRole('button', { name: 'Mostrar senha' })

    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await expect(visibilityButton).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })

  test('validates missing credentials without sending a provider request', async ({
    page,
  }) => {
    let loginRequests = 0
    await page.route('**/api/auth/sign-in/email*', async (route) => {
      loginRequests += 1
      await route.continue()
    })

    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'E-mail' }).fill('')
    await page.getByRole('textbox', { name: 'Senha' }).fill('')
    await page.getByRole('button', { name: 'Entrar no Scoops' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Informe seu email para continuar.',
    )
    expect(loginRequests).toBe(0)
  })

  test('logs in with valid credentials and navigates to the requested destination', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerAccount()
    let credentials: { email?: string; password?: string } | undefined
    await page.route('**/api/auth/sign-in/email*', async (route) => {
      credentials = route.request().postDataJSON() as {
        email?: string
        password?: string
      }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        headers: {
          'set-cookie':
            'scoops.session_token=browser-manager-session; Path=/; HttpOnly; SameSite=Lax',
        },
        body: JSON.stringify(AUTH_SESSION),
      })
    })

    await page.goto('/login?returnTo=%2F')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'E-mail' }).fill(LOGIN_CREDENTIALS.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill(LOGIN_CREDENTIALS.password)
    await page.getByRole('button', { name: 'Entrar no Scoops' }).click()

    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeVisible()
    expect(credentials).toMatchObject(LOGIN_CREDENTIALS)
  })

  test('shows a neutral error when the provider rejects credentials', async ({
    page,
  }) => {
    await page.route('**/api/auth/sign-in/email*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 400,
        body: JSON.stringify({
          code: 'invalid_credentials',
          message: 'Invalid login credentials',
        }),
      })
    })

    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'E-mail' }).fill(LOGIN_CREDENTIALS.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill(LOGIN_CREDENTIALS.password)
    await page.getByRole('button', { name: 'Entrar no Scoops' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível entrar. Confira seus dados e tente novamente.',
    )
    await expect(page).toHaveURL(/\/login/)
  })

  test('toggles password visibility and keeps the form usable', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const passwordInput = page.getByRole('textbox', { name: 'Senha' })
    const visibilityButton = page.getByRole('button', { name: 'Mostrar senha' })

    await visibilityButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
