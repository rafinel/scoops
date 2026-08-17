import { expect, realTest as test } from '../../playwright'

const managerEmail = process.env.SCOOPS_E2E_EMAIL ?? 'manager.seed@scoops.com'
const managerPassword = process.env.SCOOPS_E2E_PASSWORD ?? '12345678'

test.describe.configure({ mode: 'serial' })

test('validates the profile and shop-settings flow against the running services', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(managerEmail)
  await page.getByRole('textbox', { name: 'Senha' }).fill(managerPassword)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Minha conta' })).toBeVisible()

  await page.setViewportSize({ width: 1481, height: 1050 })
  await page.screenshot({
    path: '../../documentation/features/identity/features/profile-and-ice-cream-settings/evidence/screenshots/rev-3/real-my-account-desktop-1481x1050.png',
  })

  await page.getByRole('button', { name: 'Corrigir meu nome' }).click()
  await page.setViewportSize({ width: 676, height: 502 })
  await page.screenshot({
    path: '../../documentation/features/identity/features/profile-and-ice-cream-settings/evidence/screenshots/rev-3/real-my-account-name-dialog-676x502.png',
  })
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click()

  await page.goto('/shop-settings')
  await expect(page.getByRole('heading', { name: 'Sorveteria', exact: true })).toBeVisible()
  const originalName = await page
    .locator('section')
    .getByRole('heading', { level: 3 })
    .first()
    .textContent()
  expect(originalName).toBeTruthy()

  await page.setViewportSize({ width: 1551, height: 1050 })
  await page.screenshot({
    path: '../../documentation/features/identity/features/profile-and-ice-cream-settings/evidence/screenshots/rev-3/real-shop-settings-desktop-1551x1050.png',
  })

  const persistedName = `Scoops E2E ${Date.now()}`
  await page.getByRole('button', { name: 'Corrigir nome' }).click()
  await page.getByRole('dialog').getByRole('textbox', { name: 'Nome da loja' }).fill(persistedName)
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar alteração' }).click()
  await expect(page.getByRole('heading', { name: persistedName, exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: persistedName, exact: true })).toBeVisible()

  const expiredSessionResponse = await page.evaluate(async () => {
    const response = await fetch('http://127.0.0.1:3336/establishments/current', {
      headers: { Authorization: 'Bearer expired-e2e-token' },
    })
    return response.status
  })
  expect(expiredSessionResponse).toBe(401)

  await page.getByRole('button', { name: 'Corrigir nome' }).click()
  await page.getByRole('dialog').getByRole('textbox', { name: 'Nome da loja' }).fill(originalName ?? '')
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar alteração' }).click()
  await expect(page.getByRole('heading', { name: originalName ?? '', exact: true })).toBeVisible()

  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fshop-settings/)
  expect(consoleErrors.filter((message) => !message.includes('401 (Unauthorized)'))).toEqual([])
  expect(failedRequests).toEqual([])
})
