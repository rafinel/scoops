import { test as playwrightTest } from '@playwright/test'
import { IdentityModuleFixture } from './fixtures/identity-module-fixture'
import { MrpFixture } from './fixtures/mrp-module-fixture'

export const test = playwrightTest.extend<{
  identity: IdentityModuleFixture
  mrp: MrpFixture
}>({
  identity: [
    async ({ page }, use) => {
      const fixture = IdentityModuleFixture(page)
      await fixture.mockAnonymousProvider()
      await use(fixture)
    },
    { auto: true },
  ],
  mrp: async ({ page }, use) => {
    await use(MrpFixture(page))
  },
})

export { expect } from '@playwright/test'
