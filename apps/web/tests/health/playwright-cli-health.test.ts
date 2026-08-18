import { expect, test } from '@playwright/test'

test.describe('Playwright CLI health', () => {
  test('launches the browser and validates the local page lifecycle', async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const failedRequests: string[] = []
    const httpErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(
        `${request.method()} ${request.url()} — ${request.failure()?.errorText}`,
      )
    })
    page.on('response', (response) => {
      if (response.status() >= 400) {
        httpErrors.push(
          `${response.status()} ${response.request().method()} ${response.url()}`,
        )
      }
    })

    await page.route('**/auth/v1/session*', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({ data: { session: null }, error: null }),
      })
    })

    expect(page.context().browser()).not.toBeNull()

    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' })
    expect(response).not.toBeNull()
    expect(response?.ok()).toBeTruthy()

    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()
    const emailInput = page.getByRole('textbox', { name: 'E-mail' })
    const passwordInput = page.getByRole('textbox', { name: 'Senha' })

    await emailInput.focus()
    await expect(emailInput).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(passwordInput).toBeFocused()

    const screenshotPath = testInfo.outputPath('playwright-cli-health.png')
    await page.screenshot({ path: screenshotPath, fullPage: true })

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    expect(failedRequests, failedRequests.join('\n')).toEqual([])
    expect(httpErrors, httpErrors.join('\n')).toEqual([])
  })
})
