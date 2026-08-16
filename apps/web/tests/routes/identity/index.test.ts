import { expect, test } from '../../playwright'

test.describe('Root route', () => {
  test('redirects anonymous users with a sanitized return path', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/login\?returnTo=%2F?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
    expect(await page.content()).not.toContain('Bem-vindo,')
  })

  test('renders the authenticated application shell for a manager', async ({
    page,
    identity,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()

    await page.goto('/')

    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /Manager Browser/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Usuários' })).toHaveAttribute(
      'href',
      '/users',
    )
  })

  test('shows the unavailable state when session verification fails', async ({
    page,
    identity,
  }) => {
    await identity.mockManagerSession()
    let accountRequests = 0
    await page.route('**/auth/session*', async (route) => {
      accountRequests += 1
      await route.fulfill({
        contentType: 'application/json',
        status: 503,
        body: JSON.stringify({ message: 'Identity service unavailable' }),
      })
    })

    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Acesso temporariamente indisponível' }),
    ).toBeVisible()
    await expect(
      page.getByText('Não foi possível verificar seu acesso agora.'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect.poll(() => accountRequests).toBeGreaterThan(1)
  })

  test('keeps expired recovery links behind the authentication boundary', async ({
    page,
  }) => {
    await page.goto(
      '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    )

    await expect(page).toHaveURL(/\/login\?returnTo=%2F?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
  })
})
