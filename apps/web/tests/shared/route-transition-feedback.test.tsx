import type { Locator, Page } from '@playwright/test'

import { ROUTES } from '../../src/constants/routes'
import { expect, test } from '../playwright'

const VIEWPORTS = [
  { height: 900, name: 'desktop', width: 1440 },
  { height: 800, name: 'narrow', width: 320 },
] as const

const PRODUCTS_PAGE = {
  items: [
    {
      brandCount: 0,
      idealStock: 10,
      product: {
        categories: ['ingredient'],
        createdAt: '2026-08-17T12:00:00.000Z',
        establishmentId: 'establishment-1',
        id: 'product-1',
        name: 'Leite integral',
        status: 'active',
        stockControl: 'single',
        unit: 'l',
        updatedAt: '2026-08-17T12:00:00.000Z',
      },
      stockQuantity: 0,
      stockSituation: 'low',
    },
  ],
  kpis: { brands: 7, lowStock: 4, products: 22 },
  page: 1,
  pageSize: 10,
  totalItems: 1,
  totalPages: 1,
}

type Diagnostics = {
  consoleErrors: string[]
  expectedAnimationAbortErrors: string[]
  expectedAuthConsoleErrors: string[]
  expectedAuthResponses: string[]
  failedRequests: string[]
  httpErrors: string[]
}

function collectDiagnostics(page: Page) {
  const diagnostics: Diagnostics = {
    consoleErrors: [],
    expectedAnimationAbortErrors: [],
    expectedAuthConsoleErrors: [],
    expectedAuthResponses: [],
    failedRequests: [],
    httpErrors: [],
  }

  page.on('console', (message) => {
    if (message.type() !== 'error') return

    if (message.text().includes('401 (Unauthorized)')) {
      diagnostics.expectedAuthConsoleErrors.push(message.text())
      return
    }

    if (
      message.text().includes('Failed to load animation data from URL') &&
      message.text().includes('AbortError')
    ) {
      diagnostics.expectedAnimationAbortErrors.push(message.text())
      return
    }

    diagnostics.consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    diagnostics.failedRequests.push(`${request.method()} ${request.url()}`)
  })
  page.on('response', (response) => {
    const responseDescription = `${response.status()} ${response.request().method()} ${response.url()}`
    if (response.status() === 401 && response.url().includes('/auth/session')) {
      diagnostics.expectedAuthResponses.push(responseDescription)
    } else if (response.status() >= 400) {
      diagnostics.httpErrors.push(responseDescription)
    }
  })

  return diagnostics
}

function expectCleanDiagnostics(diagnostics: Diagnostics) {
  expect(diagnostics.consoleErrors).toEqual([])
  expect(
    diagnostics.expectedAnimationAbortErrors.every((error) =>
      error.includes('/assets/lotties/ice-cream-loading.lottie'),
    ),
  ).toBe(true)
  expect(diagnostics.failedRequests).toEqual([])
  expect(diagnostics.httpErrors).toEqual([])
  expect(diagnostics.expectedAuthConsoleErrors).toHaveLength(1)
  expect(diagnostics.expectedAuthResponses).toHaveLength(1)
}

async function expectStatusCardNotToObscureControls(
  page: Page,
  controls: readonly Locator[],
) {
  const statusCardBox = await page.locator('[data-route-transition-card]').boundingBox()
  expect(statusCardBox).not.toBeNull()
  if (!statusCardBox) throw new Error('The route transition card must be visible.')

  for (const control of controls) {
    const controlBox = await control.boundingBox()
    expect(controlBox).not.toBeNull()
    if (!controlBox) throw new Error('The tested control must be visible.')

    const overlaps =
      statusCardBox.x < controlBox.x + controlBox.width &&
      statusCardBox.x + statusCardBox.width > controlBox.x &&
      statusCardBox.y < controlBox.y + controlBox.height &&
      statusCardBox.y + statusCardBox.height > controlBox.y
    expect(overlaps).toBe(false)
  }
}

for (const viewport of VIEWPORTS) {
  test(`MV-03 captures fast route navigation at ${viewport.name} ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    const diagnostics = collectDiagnostics(page)
    await page.setViewportSize({ height: viewport.height, width: viewport.width })
    await page.goto(ROUTES.login)

    const forgotPassword = page.getByRole('link', { name: 'Esqueci minha senha' })
    await forgotPassword.focus()
    await expect(forgotPassword).toBeFocused()
    await forgotPassword.click()

    await expect(page).toHaveURL(new RegExp(`${ROUTES.forgotPassword}/?$`))
    await expect(page.getByRole('heading', { name: 'Recupere seu acesso' })).toHaveCount(
      1,
    )
    await expect(page.getByRole('status', { name: 'Carregando página…' })).toHaveCount(0)
    await page.screenshot({
      fullPage: false,
      path: `test-results/route-transition/mv-03-fast-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    })
    expectCleanDiagnostics(diagnostics)
  })
}

for (const viewport of VIEWPORTS) {
  test(`MV-04 captures reduced-motion route navigation at ${viewport.name} ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    const diagnostics = collectDiagnostics(page)
    await page.setViewportSize({ height: viewport.height, width: viewport.width })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.login)

    const forgotPassword = page.getByRole('link', { name: 'Esqueci minha senha' })
    await expect(forgotPassword).toBeVisible()
    await forgotPassword.click()

    await expect(page).toHaveURL(new RegExp(`${ROUTES.forgotPassword}/?$`))
    await expect(page.getByRole('heading', { name: 'Recupere seu acesso' })).toHaveCount(
      1,
    )
    await expect(page.locator('body')).toHaveCSS('overflow-x', 'visible')
    await expect(page.getByRole('status', { name: 'Carregando página…' })).toHaveCount(0)
    await page.screenshot({
      fullPage: false,
      path: `test-results/route-transition/mv-04-reduced-motion-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    })
    expectCleanDiagnostics(diagnostics)
  })
}

async function holdAuthenticatedRouteNavigation(
  page: Page,
  identityFixture: {
    mockManagerAccount: () => Promise<void>
  },
) {
  let hasHeldServerFunction = false
  let shouldHoldServerFunction = true
  let releaseServerFunction = () => {}

  await identityFixture.mockManagerAccount()
  await page.route('**/api/auth/sign-in/email*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      headers: {
        'set-cookie':
          'scoops.session_token=browser-manager-session; Path=/; HttpOnly; SameSite=Lax',
      },
      body: JSON.stringify({
        user: { id: 'browser-manager-id', email: 'manager@example.com' },
        session: { id: 'better-auth-session-id' },
      }),
    })
  })
  await page.goto(`${ROUTES.login}?returnTo=${encodeURIComponent(ROUTES.root)}`)
  const forgotPassword = page.getByRole('link', { name: 'Esqueci minha senha' })
  await page.route('**/_serverFn/**', async (route) => {
    if (!shouldHoldServerFunction) {
      await route.continue()
      return
    }

    shouldHoldServerFunction = false
    hasHeldServerFunction = true
    await new Promise<void>((resolve) => {
      releaseServerFunction = resolve
    })
    await route.continue()
  })

  const emailInput = page.getByRole('textbox', { name: 'E-mail' })
  const passwordInput = page.getByRole('textbox', { name: 'Senha' })
  const submitButton = page.getByRole('button', { name: 'Entrar no Scoops' })
  await emailInput.fill('manager@example.com')
  await passwordInput.fill('password123')
  await submitButton.focus()
  await expect(submitButton).toBeFocused()
  await submitButton.click()
  await expect.poll(() => hasHeldServerFunction).toBe(true)

  return {
    release() {
      releaseServerFunction()
    },
    forgotPassword,
    submitButton,
  }
}

for (const viewport of VIEWPORTS) {
  test(`covers authenticated products start and public exit at ${viewport.name} ${viewport.width}x${viewport.height}`, async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    const diagnostics = collectDiagnostics(page)
    await page.setViewportSize({ height: viewport.height, width: viewport.width })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      Object.defineProperty(document, 'startViewTransition', {
        configurable: true,
        value: undefined,
      })
    })
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProducts({ getResponse: { body: PRODUCTS_PAGE } })
    let signOutRequests = 0
    await page.route('**/api/auth/sign-out*', async (route) => {
      signOutRequests += 1
      await route.fulfill({ body: '', status: 204 })
    })

    await page.goto(ROUTES.products)
    expect(new URL(page.url()).pathname).toBe(ROUTES.products)
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()

    await page.getByRole('button', { name: 'Manager Browser — Gerente' }).click()
    await page.getByRole('menuitem', { name: 'Sair deste dispositivo' }).click()

    expect(new URL(page.url()).pathname).toBe(ROUTES.login)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Carregando página…' })).toHaveCount(0)
    await expect(page.locator('body')).toContainText('Entre no Scoops')
    expect(signOutRequests).toBe(1)
    await page.screenshot({
      fullPage: false,
      path: `test-results/route-transition/mv-03-authenticated-exit-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    })
    expect(diagnostics.consoleErrors).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
    expect(diagnostics.httpErrors).toEqual([])
  })
}

test('swaps public routes immediately when View Transitions are unsupported', async ({
  page,
}) => {
  const diagnostics = collectDiagnostics(page)
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: undefined,
    })
  })
  await page.goto(ROUTES.login)

  expect(await page.evaluate(() => typeof document.startViewTransition)).toBe('undefined')
  const forgotPassword = page.getByRole('link', { name: 'Esqueci minha senha' })
  await forgotPassword.focus()
  await forgotPassword.press('Enter')

  await expect(page).toHaveURL(new RegExp(`${ROUTES.forgotPassword}/?$`))
  await expect(page.getByRole('heading', { name: 'Recupere seu acesso' })).toBeVisible()
  await expect(page.getByRole('status', { name: 'Carregando página…' })).toHaveCount(0)
  await page.screenshot({
    fullPage: false,
    path: 'test-results/route-transition/unsupported-view-transition.png',
  })
  expectCleanDiagnostics(diagnostics)
})

for (const viewport of VIEWPORTS) {
  test(`MV-03 captures delayed route status at ${viewport.name} ${viewport.width}x${viewport.height}`, async ({
    page,
    identityFixture,
  }) => {
    const diagnostics = collectDiagnostics(page)
    await page.setViewportSize({ height: viewport.height, width: viewport.width })
    const { forgotPassword, release, submitButton } =
      await holdAuthenticatedRouteNavigation(page, identityFixture)
    const activeElementBeforeStatus = await page.evaluate(() => {
      const activeElement = document.activeElement
      return [
        activeElement?.tagName,
        activeElement?.id,
        activeElement?.getAttribute('aria-label'),
        activeElement?.getAttribute('type'),
      ]
    })

    const status = page.getByRole('status', { name: 'Carregando página…' })
    await expect(status).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
    await expect(status).toHaveCSS('pointer-events', 'none')
    await expect(status).not.toHaveAttribute('aria-modal')
    await expect(status.locator('button, a, input, textarea, select')).toHaveCount(0)
    expect(
      await page.evaluate(() => {
        const activeElement = document.activeElement
        return [
          activeElement?.tagName,
          activeElement?.id,
          activeElement?.getAttribute('aria-label'),
          activeElement?.getAttribute('type'),
        ]
      }),
    ).toEqual(activeElementBeforeStatus)
    await expect(submitButton).toBeAttached()
    await submitButton.focus()
    await expect(submitButton).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(forgotPassword).toBeFocused()
    await expect(page.locator('[data-route-transition-artwork]')).toBeVisible()
    await expect(page.locator('[data-route-transition-artwork]')).toHaveAttribute(
      'width',
      '96',
    )
    await expectStatusCardNotToObscureControls(page, [
      page.getByRole('textbox', { name: 'E-mail' }),
      page.getByRole('textbox', { name: 'Senha' }),
      submitButton,
    ])
    await page.screenshot({
      fullPage: false,
      path: `test-results/route-transition/mv-03-delayed-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    })

    release()
    await expect(page).toHaveURL(new RegExp(`${ROUTES.root}$`))
    await expect(status).toHaveCount(0)
    await expect(page.getByRole('banner')).toBeVisible()
    await page.screenshot({
      fullPage: false,
      path: `test-results/route-transition/mv-03-delayed-destination-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    })
    expect(diagnostics.consoleErrors).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
    expect(diagnostics.httpErrors).toEqual([])
  })
}

for (const viewport of VIEWPORTS) {
  test(`MV-04 captures delayed reduced-motion route status at ${viewport.name} ${viewport.width}x${viewport.height}`, async ({
    page,
    identityFixture,
  }) => {
    const diagnostics = collectDiagnostics(page)
    await page.setViewportSize({ height: viewport.height, width: viewport.width })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const { forgotPassword, release, submitButton } =
      await holdAuthenticatedRouteNavigation(page, identityFixture)
    const activeElementBeforeStatus = await page.evaluate(() => {
      const activeElement = document.activeElement
      return [
        activeElement?.tagName,
        activeElement?.id,
        activeElement?.getAttribute('aria-label'),
        activeElement?.getAttribute('type'),
      ]
    })

    const status = page.getByRole('status', { name: 'Carregando página…' })
    await expect(status).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
    await expect(status).toHaveCSS('pointer-events', 'none')
    await expect(status).not.toHaveAttribute('aria-modal')
    await expect(status.locator('button, a, input, textarea, select')).toHaveCount(0)
    expect(
      await page.evaluate(() => {
        const activeElement = document.activeElement
        return [
          activeElement?.tagName,
          activeElement?.id,
          activeElement?.getAttribute('aria-label'),
          activeElement?.getAttribute('type'),
        ]
      }),
    ).toEqual(activeElementBeforeStatus)
    await expect(submitButton).toBeAttached()
    await submitButton.focus()
    await expect(submitButton).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(forgotPassword).toBeFocused()
    await expect(page.locator('[data-route-transition-artwork]')).toHaveCount(0)
    await expectStatusCardNotToObscureControls(page, [
      page.getByRole('textbox', { name: 'E-mail' }),
      page.getByRole('textbox', { name: 'Senha' }),
      submitButton,
    ])
    await page.screenshot({
      fullPage: false,
      path: `test-results/route-transition/mv-04-delayed-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    })

    release()
    await expect(page).toHaveURL(new RegExp(`${ROUTES.root}$`))
    await expect(status).toHaveCount(0)
    await expect(page.getByRole('banner')).toBeVisible()
    await page.screenshot({
      fullPage: false,
      path: `test-results/route-transition/mv-04-delayed-destination-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    })
    expect(diagnostics.consoleErrors).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
    expect(diagnostics.httpErrors).toEqual([])
  })
}
