import { test as playwrightTest } from '@playwright/test'
import { IdentityModuleFixture } from './fixtures/identity-module-fixture'

export const test = playwrightTest.extend<{
  identity: IdentityModuleFixture
}>({
  identity: [
    async ({ page }, use) => {
      const fixture = IdentityModuleFixture(page)
      await fixture.mockAnonymousProvider()
      await use(fixture)
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
