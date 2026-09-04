import { expect, test } from '../../playwright'

const CONFIRMATION_TOKEN = 'c'.repeat(43)

test.describe('Onboarding confirmation route', () => {
  test('renders a safe recovery state for a missing confirmation token', async ({
    page,
  }) => {
    let confirmationRequests = 0
    await page.route('**/registration-attempts/onboarding/confirm*', async (route) => {
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
    await page.route('**/registration-attempts/onboarding/confirm*', async (route) => {
      confirmationRequests += 1
      await route.continue()
    })

    await page.goto('/onboarding/confirm?confirmationToken=not-a-token')

    await expect(
      page.getByRole('heading', { name: 'Não foi possível confirmar' }),
    ).toBeVisible()
    expect(confirmationRequests).toBe(0)
  })

  test('shows the confirming state while the confirmation request is pending', async ({
    page,
  }) => {
    let releaseConfirmation!: () => void
    const confirmationReady = new Promise<void>((resolve) => {
      releaseConfirmation = resolve
    })
    await page.route('**/registration-attempts/onboarding/confirm*', async (route) => {
      await confirmationReady
      await route.fulfill({ status: 204, body: '' })
    })

    const navigation = page.goto(
      `/onboarding/confirm?confirmationToken=${CONFIRMATION_TOKEN}`,
    )
    await expect(page.getByRole('status')).toContainText('Confirmando seu cadastro')
    await expect(page.getByRole('button', { name: 'Começar novamente' })).toHaveCount(0)

    releaseConfirmation()
    await navigation
    await expect(
      page.getByRole('heading', { name: 'Não foi possível confirmar' }),
    ).toBeVisible()
  })

  test('surfaces a provider error without exposing onboarding details', async ({
    page,
  }) => {
    await page.route('**/registration-attempts/onboarding/confirm*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 400,
        body: JSON.stringify({ message: 'O link de confirmação expirou.' }),
      })
    })

    await page.goto(`/onboarding/confirm?confirmationToken=${CONFIRMATION_TOKEN}`)
    await expect(
      page.getByRole('heading', { name: 'Não foi possível confirmar' }),
    ).toBeVisible()
    await expect(page.getByText('O link de confirmação expirou.')).toBeVisible()
    await expect(page.getByText('Confira sua caixa de entrada')).toHaveCount(0)
  })

  test('confirms onboarding, clears the confirmation boundary, and opens the app', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let confirmationBody: { confirmationToken?: string } | undefined
    await page.route('**/registration-attempts/onboarding/confirm*', async (route) => {
      confirmationBody = route.request().postDataJSON() as { confirmationToken?: string }
      await route.fulfill({ status: 204, body: '' })
    })

    await page.goto(
      `/onboarding/confirm?confirmationToken=${CONFIRMATION_TOKEN}#type=signup`,
    )

    await expect(page).toHaveURL('/')
    await expect(
      page.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeVisible()
    expect(confirmationBody?.confirmationToken).toBe(CONFIRMATION_TOKEN)
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
  })
})
