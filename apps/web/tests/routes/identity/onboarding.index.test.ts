import type { Page } from '@playwright/test'

import { expect, test } from '../../playwright'
import {
  onboardingRegistration,
  pendingOnboarding,
} from '../../fixtures/identity-data-fixtures'

const ONBOARDING_PASSWORD = 'password123'

async function fillRegistrationForm(page: Page) {
  await page.getByRole('textbox', { name: 'Nome da sorveteria' }).fill('Gelato Central')
  await page.getByRole('textbox', { name: 'Seu nome' }).fill('Marina Manager')
  await page.getByRole('textbox', { name: 'E-mail' }).fill('marina@example.com')
  await page
    .getByRole('textbox', { name: 'Senha', exact: true })
    .fill(ONBOARDING_PASSWORD)
  await page
    .getByRole('textbox', { name: 'Confirme sua senha' })
    .fill(ONBOARDING_PASSWORD)
}

test.describe.configure({ mode: 'serial' })
test.describe('Ice cream shop onboarding route', () => {
  test('renders the registration form and credential controls', async ({ page }) => {
    await page.goto('/onboarding')

    await expect(page).toHaveURL(/\/onboarding\/?$/)
    await expect(page.getByRole('heading', { name: 'Crie sua sorveteria' })).toBeVisible()
    await expect(
      page.getByRole('textbox', { name: 'Nome da sorveteria' }),
    ).toHaveAttribute('autocomplete', 'organization')
    await expect(page.getByRole('textbox', { name: 'Seu nome' })).toHaveAttribute(
      'autocomplete',
      'name',
    )
    await expect(page.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute(
      'autocomplete',
      'email',
    )
    await expect(
      page.getByRole('textbox', { name: 'Senha', exact: true }),
    ).toHaveAttribute('autocomplete', 'new-password')
    await expect(page.getByRole('textbox', { name: 'Confirme sua senha' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Entrar' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  test('shows required-field validation without sending a registration request', async ({
    page,
  }) => {
    let registrationRequests = 0
    await page.route('**/registration-attempts/onboarding*', async (route) => {
      registrationRequests += 1
      await route.continue()
    })

    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Criar sorveteria' }).click()

    await expect(page.getByRole('alert')).toContainText('Preencha os dados')
    expect(registrationRequests).toBe(0)
  })

  test('rejects mismatched passwords before transport', async ({ page }) => {
    let registrationRequests = 0
    await page.route('**/registration-attempts/onboarding*', async (route) => {
      registrationRequests += 1
      await route.continue()
    })

    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'Nome da sorveteria' }).fill('Gelato Central')
    await page.getByRole('textbox', { name: 'Seu nome' }).fill('Marina Manager')
    await page.getByRole('textbox', { name: 'E-mail' }).fill('marina@example.com')
    await page
      .getByRole('textbox', { name: 'Senha', exact: true })
      .fill(ONBOARDING_PASSWORD)
    await page.getByRole('textbox', { name: 'Confirme sua senha' }).fill('different123')
    await page.getByRole('button', { name: 'Criar sorveteria' }).click()

    await expect(page.getByRole('alert')).toContainText('As senhas precisam ser iguais.')
    expect(registrationRequests).toBe(0)
  })

  test('registers valid data and renders the pending confirmation state', async ({
    page,
  }) => {
    const registration = onboardingRegistration()
    let requestBody: Record<string, string> | undefined
    await page.route('**/registration-attempts/onboarding*', async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, string>
      await route.fulfill({
        contentType: 'application/json',
        status: 201,
        body: JSON.stringify({
          ...registration,
          onboarding: {
            ...registration.onboarding,
            expiresAt: registration.onboarding.expiresAt.toISOString(),
          },
        }),
      })
    })

    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await fillRegistrationForm(page)
    await page.getByRole('button', { name: 'Criar sorveteria' }).click()

    await expect(
      page.getByRole('heading', { name: 'Confira sua caixa de entrada' }),
    ).toBeVisible()
    await expect(page.getByText(registration.onboarding.email)).toBeVisible()
    await expect(page.getByText(registration.onboarding.establishmentName)).toBeVisible()
    expect(requestBody).toEqual({
      establishmentName: 'Gelato Central',
      managerName: 'Marina Manager',
      email: 'marina@example.com',
      password: ONBOARDING_PASSWORD,
    })
  })

  test('shows a neutral error when registration fails', async ({ page }) => {
    await page.route('**/registration-attempts/onboarding*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 503,
        body: JSON.stringify({ message: 'Serviço temporariamente indisponível.' }),
      })
    })

    await page.goto('/onboarding')
    await page.waitForLoadState('networkidle')
    await fillRegistrationForm(page)
    await page.getByRole('button', { name: 'Criar sorveteria' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Serviço temporariamente indisponível.',
    )
    await expect(page.getByRole('heading', { name: 'Crie sua sorveteria' })).toBeVisible()
  })

  test('restores a saved continuation and allows resending the confirmation', async ({
    page,
  }) => {
    const onboarding = pendingOnboarding()
    const continuationToken = 'b'.repeat(43)
    const onboardingJson = {
      ...onboarding,
      expiresAt: onboarding.expiresAt.toISOString(),
    }
    await page.addInitScript(
      ({ continuationToken: token, onboarding: savedOnboarding }) => {
        window.sessionStorage.setItem(
          'scoops.identity.onboarding-session',
          JSON.stringify({
            version: 1,
            continuationToken: token,
            onboarding: savedOnboarding,
          }),
        )
      },
      { continuationToken, onboarding: onboardingJson },
    )
    let statusBody: { continuationToken?: string } | undefined
    await page.route('**/registration-attempts/onboarding/status*', async (route) => {
      statusBody = route.request().postDataJSON() as { continuationToken?: string }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ...onboarding,
          expiresAt: onboarding.expiresAt.toISOString(),
        }),
      })
    })
    await page.route('**/registration-attempts/onboarding/resend*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          ...onboarding,
          email: 'new-address@example.com',
          expiresAt: onboarding.expiresAt.toISOString(),
        }),
      })
    })

    await page.goto('/onboarding')
    await expect(
      page.getByRole('heading', { name: 'Confira sua caixa de entrada' }),
    ).toBeVisible()
    expect(statusBody?.continuationToken).toBe(continuationToken)
    await page.getByRole('button', { name: 'Reenviar confirmação' }).click()

    await expect(
      page.getByText('Uma nova confirmação foi enviada', { exact: false }),
    ).toContainText('Uma nova confirmação foi enviada')
    await expect(page.getByText('new-address@example.com')).toBeVisible()
  })
})
