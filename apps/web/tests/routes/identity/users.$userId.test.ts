import { expect, test } from '../../playwright'
import { userDetailsJson } from '../../fixtures/identity-data-fixtures'

const ACTIVE_USER_DETAILS = userDetailsJson({
  user: {
    lastAccessAt: new Date('2026-01-05T09:30:00.000Z'),
  },
})

test.describe('User detail route', () => {
  test('protects the route and preserves its return path', async ({ page }) => {
    await page.goto('/users/user-operator')
    await expect(page).toHaveURL(/\/login\?returnTo=/)
    expect(new URL(page.url()).searchParams.get('returnTo')).toContain(
      '/users/user-operator',
    )
  })

  test('renders account details, audit history, and profile permissions', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.route('**/users/user-operator', async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue()
        return
      }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(ACTIVE_USER_DETAILS),
      })
    })

    await page.goto('/users/user-operator')

    await expect(page.getByRole('heading', { name: 'Detalhe do usuário' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ana Operator' })).toBeVisible()
    await expect(page.getByText('ana@example.com')).toBeVisible()
    await expect(page.getByText('Ativo', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Histórico de alterações' }),
    ).toBeVisible()
    await expect(page.getByText('Usuário cadastrado')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Permissões do perfil' }),
    ).toBeVisible()
    await expect(page.getByText('Acesso focado na operação diária')).toBeVisible()
  })

  test('shows pending invitation actions without active-account controls', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.route('**/users/pending-user', async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue()
        return
      }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(
          userDetailsJson({
            user: {
              id: 'pending-user',
              name: 'Pedro Pending',
              email: 'pedro@example.com',
              status: 'pending',
            },
          }),
        ),
      })
    })

    await page.goto('/users/pending-user')

    await expect(page.getByText('Convite pendente', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reenviar convite' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar convite' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Desativar acesso' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Promover a gerente' })).toHaveCount(0)
    await expect(page.getByText('Aguardando confirmação')).toBeVisible()
  })

  test('confirms a profile change and sends the expected request', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let profileBody: { profile?: string } | undefined
    await page.route('**/users/user-operator', async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue()
        return
      }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(ACTIVE_USER_DETAILS),
      })
    })
    await page.route('**/users/user-operator/profile', async (route) => {
      profileBody = route.request().postDataJSON() as { profile?: string }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(
          userDetailsJson({
            user: {
              id: 'user-operator',
              name: 'Ana Operator',
              email: 'ana@example.com',
              profile: 'manager',
            },
            auditRecords: [],
          }),
        ),
      })
    })

    await page.goto('/users/user-operator')
    await page.getByRole('button', { name: 'Promover a gerente' }).click()
    await expect(
      page.getByRole('alertdialog', { name: 'Promover usuário?' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar' }).click()

    await expect(
      page.getByRole('alertdialog', { name: 'Promover usuário?' }),
    ).toHaveCount(0)
    expect(profileBody?.profile).toBe('manager')
  })

  test('renders a retry state when the user cannot be loaded', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let detailRequests = 0
    await page.route('**/users/missing-user', async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue()
        return
      }
      detailRequests += 1
      await route.fulfill({
        contentType: 'application/json',
        status: 404,
        body: JSON.stringify({ message: 'Usuário não encontrado.' }),
      })
    })

    await page.goto('/users/missing-user')
    await expect(page.getByText('Não foi possível carregar este usuário.')).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect.poll(() => detailRequests).toBe(2)
  })
})
