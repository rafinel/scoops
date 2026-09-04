import { expect, test } from '../../playwright'
import { userDetailsJson, usersPageJson } from '../../fixtures/identity-data-fixtures'

const USERS_RESPONSE = usersPageJson()
test.describe.configure({ mode: 'serial' })
test.describe('Users route', () => {
  test('protects the route and preserves the requested filter URL', async ({ page }) => {
    await page.goto('/users?page=3&profile=operator&status=active&search=Ana')
    await expect(page).toHaveURL(/\/login\?returnTo=/)
    expect(new URL(page.url()).searchParams.get('returnTo')).toContain('page=3')
    expect(new URL(page.url()).searchParams.get('returnTo')).toContain('search=Ana')
  })

  test('renders manager data, statuses, profiles, and row actions', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.route('**/users?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(USERS_RESPONSE),
      })
    })

    await page.goto('/users')

    await expect(page.getByRole('heading', { name: /Usuários/ })).toContainText('(3)')
    await expect(page.getByText('Carla Manager')).toBeVisible()
    await expect(page.getByText('Ana Operator')).toBeVisible()
    await expect(page.getByText('Pedro Pending')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Gerente', exact: true })).toBeVisible()
    await expect(page.getByText('Operador', { exact: true })).toHaveCount(2)
    await expect(page.getByText('Ativo', { exact: true })).toHaveCount(2)
    await expect(page.getByText('Convite pendente', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Abrir ações de Ana Operator' }).click()
    await expect(page.getByRole('menuitem', { name: 'Editar usuário' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Promover a gerente' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Desativar acesso' })).toBeVisible()
  })

  test('updates search and filters in the URL and API request', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const listRequests: URL[] = []
    const consoleErrors: string[] = []
    const failedRequests: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => failedRequests.push(request.url()))
    await page.route('**/users?*', async (route) => {
      const requestUrl = new URL(route.request().url())
      listRequests.push(requestUrl)
      const isFiltered = Boolean(
        requestUrl.searchParams.get('search') ||
          requestUrl.searchParams.get('profile') ||
          requestUrl.searchParams.get('status'),
      )
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(
          isFiltered
            ? {
                ...USERS_RESPONSE,
                items: [
                  {
                    ...USERS_RESPONSE.items[1],
                    status:
                      requestUrl.searchParams.get('status') ??
                      USERS_RESPONSE.items[1].status,
                  },
                ],
                total: 1,
                totalPages: 1,
              }
            : USERS_RESPONSE,
        ),
      })
    })

    await page.setViewportSize({ width: 1481, height: 900 })
    await page.goto('/users')
    await expect(page.getByText('Carla Manager')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Usuários/ })).toContainText('(3)')
    await expect(page.getByRole('button', { name: 'Todos 3' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gerentes 1' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Operadores 2' })).toBeVisible()

    await page.getByRole('textbox', { name: 'Buscar usuários' }).fill('Ana')
    await expect(page).toHaveURL(/search=Ana/)
    await expect.poll(() => listRequests.at(-1)?.searchParams.get('search')).toBe('Ana')
    await expect(page.getByText('Carla Manager')).toHaveCount(0)
    await expect(page.getByText('Ana Operator')).toBeVisible()
    await expect(page.getByText('Mostrando 1 de 1 usuários')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Usuários/ })).toContainText('(3)')
    await expect(page.getByRole('button', { name: 'Todos 3' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gerentes 1' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Operadores 2' })).toBeVisible()

    await page.getByRole('button', { name: /Operadores/ }).click()
    await expect(page).toHaveURL(/profile=operator/)
    await expect
      .poll(() => listRequests.at(-1)?.searchParams.get('profile'))
      .toBe('operator')

    await page.getByRole('combobox', { name: 'Filtrar status' }).click()
    await page.getByRole('option', { name: 'Inativos' }).click()
    await expect(page).toHaveURL(/status=inactive/)
    await expect
      .poll(() => listRequests.at(-1)?.searchParams.get('status'))
      .toBe('inactive')
    expect(listRequests.at(-1)?.searchParams.get('page')).toBe('1')
    await expect(page.getByText('Ana Operator')).toBeVisible()
    await page.screenshot({
      path: 'test-results/users-filtered-global-summary-1481x900.png',
    })

    expect(listRequests).toHaveLength(4)
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })

  test('renders a retry state when loading users fails', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let listRequests = 0
    await page.route('**/users?*', async (route) => {
      listRequests += 1
      await route.fulfill({
        contentType: 'application/json',
        status: 503,
        body: JSON.stringify({ message: 'Users unavailable' }),
      })
    })

    await page.goto('/users')
    await expect(page.getByText('Não foi possível carregar os usuários.')).toBeVisible({
      timeout: 15000,
    })
    const requestsBeforeRetry = listRequests
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()

    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect.poll(() => listRequests).toBeGreaterThan(requestsBeforeRetry)
  })

  test('opens and validates the invite dialog before submission', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.route('**/users?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({ ...USERS_RESPONSE, items: [], total: 0 }),
      })
    })

    await page.goto('/users')
    await expect(page.getByText('Nenhum usuário encontrado.')).toBeVisible()
    await page.getByRole('button', { name: 'Convidar usuário' }).click()

    await expect(page.getByRole('dialog', { name: 'Novo usuário' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Operador' })).toBeChecked()
    await page.getByRole('radio', { name: 'Gerente' }).click()
    await expect(page.getByRole('radio', { name: 'Gerente' })).toBeChecked()
    await expect(page.getByText('A pessoa receberá um e-mail')).toBeVisible()

    await page.getByRole('button', { name: 'Fechar' }).click()
    await expect(page.getByRole('dialog', { name: 'Novo usuário' })).toHaveCount(0)
  })

  test('confirms a row action and sends the expected profile request', async ({
    page,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let profileBody: { profile?: string } | undefined
    await page.route('**/users?*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(USERS_RESPONSE),
      })
    })
    await page.route('**/users/operator-1/profile', async (route) => {
      profileBody = route.request().postDataJSON() as { profile?: string }
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify(
          userDetailsJson({
            user: {
              id: 'operator-1',
              name: 'Ana Operator',
              email: 'ana@example.com',
              profile: 'manager',
            },
            auditRecords: [],
          }),
        ),
      })
    })

    await page.goto('/users')
    await expect(page.getByText('Ana Operator')).toBeVisible()
    await page.getByRole('button', { name: 'Abrir ações de Ana Operator' }).click()
    await page.getByRole('menuitem', { name: 'Promover a gerente' }).click()

    await expect(
      page.getByRole('alertdialog', { name: 'Promover usuário?' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar' }).click()

    await expect(
      page.getByRole('alertdialog', { name: 'Promover usuário?' }),
    ).toHaveCount(0)
    expect(profileBody?.profile).toBe('manager')
  })
})
