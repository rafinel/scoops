import { expect, test } from '../../playwright'

const INVITATION_TOKEN = 'i'.repeat(43)

test.describe('Invitation acceptance route', () => {
  test('shows a safe idle state when the token is missing', async ({ page }) => {
    await page.goto('/invitation/accept')

    await expect(page.getByRole('heading', { name: 'Ative seu acesso' })).toBeVisible()
    await expect(
      page.getByText('Este convite não é válido ou já foi utilizado.'),
    ).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Crie uma senha' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Ativar acesso' })).toHaveCount(0)
  })

  test('shows a safe idle state when the token is malformed', async ({ page }) => {
    await page.goto('/invitation/accept?confirmationToken=not-a-token')

    await expect(page.getByRole('heading', { name: 'Ative seu acesso' })).toBeVisible()
    await expect(
      page.getByText('Este convite não é válido ou já foi utilizado.'),
    ).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Crie uma senha' })).toHaveCount(0)
  })

  test('keeps the submit action disabled until the password meets the minimum length', async ({
    page,
  }) => {
    await page.goto(`/invitation/accept?confirmationToken=${INVITATION_TOKEN}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Ative seu acesso' })).toBeVisible()
    const password = page.getByRole('textbox', { name: 'Crie uma senha' })
    const submit = page.getByRole('button', { name: 'Ativar acesso' })
    await expect(password).toHaveAttribute('autocomplete', 'new-password')
    await expect(password).toHaveAttribute('minlength', '8')
    await expect(password).toHaveAttribute('maxlength', '64')
    await expect(submit).toBeDisabled()

    await password.click()
    await password.pressSequentially('1234567')
    await expect(password).toHaveValue('1234567')
    await expect(submit).toBeDisabled()

    await password.pressSequentially('8')
    await expect(password).toHaveValue('12345678')
    await expect(submit).toBeEnabled()
  })

  test('accepts the invitation and exposes the app navigation', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()

    let acceptanceBody: { confirmationToken?: string; password?: string } | undefined
    await page.route('**/registration-attempts/invitation/accept', async (route) => {
      acceptanceBody = route.request().postDataJSON() as {
        confirmationToken?: string
        password?: string
      }
      await route.fulfill({ status: 204, body: '' })
    })

    await page.goto(`/invitation/accept?confirmationToken=${INVITATION_TOKEN}`)
    await page.waitForLoadState('networkidle')
    const password = page.getByRole('textbox', { name: 'Crie uma senha' })
    await password.click()
    await password.pressSequentially('12345678')
    await page.getByRole('button', { name: 'Ativar acesso' }).click()

    await expect(page.getByRole('heading', { name: 'Convite aceito' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ir para o Scoops' })).toBeVisible()
    expect(acceptanceBody?.confirmationToken).toBe(INVITATION_TOKEN)
    expect(acceptanceBody?.password).toBe('12345678')
  })

  test('surfaces an API failure and leaves the form available for correction', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()

    await page.route('**/registration-attempts/invitation/accept', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 400,
        body: JSON.stringify({ message: 'Convite expirado.' }),
      })
    })

    await page.goto(`/invitation/accept?confirmationToken=${INVITATION_TOKEN}`)
    await page.waitForLoadState('networkidle')
    const password = page.getByRole('textbox', { name: 'Crie uma senha' })
    await password.click()
    await password.pressSequentially('12345678')
    await page.getByRole('button', { name: 'Ativar acesso' }).click()

    await expect(page.getByRole('alert')).toContainText('Convite expirado.')
    await expect(page.getByRole('heading', { name: 'Ative seu acesso' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Crie uma senha' })).toBeVisible()
  })
})
