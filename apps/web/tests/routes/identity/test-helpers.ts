import { expect, test as playwrightTest, type Page } from '@playwright/test'

/**
 * Browser-side fixture for the Identity module boundary.
 *
 * Route tests do not construct Supabase clients or repeat provider setup. The
 * fixture provides the anonymous provider state that every public Identity
 * route needs; individual tests can still register a later route handler when
 * they need to control or observe one request.
 */
export class IdentityModuleFixture {
  constructor(private readonly page: Page) {}

  async mockAnonymousProvider() {
    await this.page.route('**/auth/v1/session', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { session: null }, error: null }),
        status: 200,
      })
    })
  }
}

type IdentityFixtures = {
  identity: IdentityModuleFixture
}

export const test = playwrightTest.extend<IdentityFixtures>({
  identity: [
    async ({ page }, use) => {
      const fixture = new IdentityModuleFixture(page)
      await fixture.mockAnonymousProvider()
      await use(fixture)
    },
    { auto: true },
  ],
})

export { expect }
