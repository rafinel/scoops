import { mkdir } from 'node:fs/promises'

import { expect, test } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'

import { PLAYWRIGHT_AUTH_STATE_PATHS, SCOOPS_SESSION_COOKIE_NAME } from './auth-state'

const AUTH_STATE_DIRECTORY = 'playwright/.auth'
const DEFAULT_SEED_PASSWORD = '12345678'

const AUTH_ACCOUNTS = [
  {
    name: 'manager',
    email: process.env.PLAYWRIGHT_MANAGER_EMAIL ?? 'manager.seed@scoops.com',
    password: process.env.PLAYWRIGHT_MANAGER_PASSWORD ?? DEFAULT_SEED_PASSWORD,
    storageStatePath: PLAYWRIGHT_AUTH_STATE_PATHS.manager,
  },
  {
    name: 'operator',
    email: process.env.PLAYWRIGHT_OPERATOR_EMAIL ?? 'operator.seed@scoops.com',
    password: process.env.PLAYWRIGHT_OPERATOR_PASSWORD ?? DEFAULT_SEED_PASSWORD,
    storageStatePath: PLAYWRIGHT_AUTH_STATE_PATHS.operator,
  },
] as const

test('creates authenticated browser storage states', async ({ browser }) => {
  test.setTimeout(90_000)
  await mkdir(AUTH_STATE_DIRECTORY, { recursive: true })

  for (const account of AUTH_ACCOUNTS) {
    await test.step(`authenticate ${account.name}`, () =>
      fakeStorageState(browser, account))
  }
})

async function fakeStorageState(
  browser: Browser,
  account: (typeof AUTH_ACCOUNTS)[number],
): Promise<void> {
  const context = await browser.newContext()

  try {
    const page = await context.newPage()
    await signIn(page, account.email, account.password)
    const state = await context.storageState()
    expect(
      state.cookies.some((cookie) => cookie.name === SCOOPS_SESSION_COOKIE_NAME),
    ).toBe(true)
    expect(state.origins).toEqual([])
    await context.storageState({ path: account.storageStatePath })
  } finally {
    await context.close()
  }
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login?returnTo=%2F')
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('textbox', { name: 'Senha' }).fill(password)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole('navigation', { name: 'Navegação principal' }),
  ).toBeVisible()
}
