import { expect, test } from '../playwright'

test.describe('Playwright CLI health check', () => {
  test('loads the login page through the dev server with stable browser basics', async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    const failedRequests: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()}`)
    })

    const response = await page.goto('/login')

    expect(response).not.toBeNull()
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/login(?:\/)?$/)
    await expect(page.getByRole('heading', { name: 'Entre no Scoops' })).toBeVisible()

    const emailInput = page.getByRole('textbox', { name: 'E-mail' })
    const passwordInput = page.getByRole('textbox', { name: 'Senha' })
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()

    await emailInput.focus()
    await page.keyboard.press('Tab')
    await expect(passwordInput).toBeFocused()

    await page.screenshot({
      path: 'test-results/playwright-cli-health-login.png',
      fullPage: true,
    })

    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })
})
