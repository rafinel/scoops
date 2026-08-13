import type { Page } from '@playwright/test'

export async function mockAnonymousProvider(page: Page) {
  await page.route('**/auth/v1/session', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { session: null }, error: null }),
      status: 200,
    })
  })
}
