import { test as playwrightTest } from '@playwright/test'
import { IdentityModuleFixture } from './fixtures/identity-module-fixture'
import { CommunicationModuleFixture } from './fixtures/communication-module-fixture'
import { MrpFixture } from './fixtures/mrp-module-fixture'
import { PdvFixture } from './fixtures/pdv-module-fixture'

export const test = playwrightTest.extend<{
  identityFixture: IdentityModuleFixture
  communicationFixture: CommunicationModuleFixture
  mrpFixture: MrpFixture
  pdvFixture: PdvFixture
}>({
  identityFixture: [
    async ({ page }, use) => {
      const fixture = IdentityModuleFixture(page)
      await fixture.mockAnonymousProvider()
      await use(fixture)
    },
    { auto: true },
  ],
  communicationFixture: [
    async ({ page }, use) => {
      const fixture = CommunicationModuleFixture(page)
      await fixture.mockNotifications()
      await use(fixture)
    },
    { auto: true },
  ],
  mrpFixture: async ({ page }, use) => {
    await use(MrpFixture(page))
  },
  pdvFixture: async ({ page }, use) => {
    await use(PdvFixture(page))
  },
})

export { expect } from '@playwright/test'
