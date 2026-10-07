import { test as playwrightTest } from '@playwright/test'
import { IdentityModuleFixture } from './fixtures/identity-module-fixture'
import { CommunicationModuleFixture } from './fixtures/communication-module-fixture'
import { MrpFixture } from './fixtures/mrp-module-fixture'
import { PdvFixture } from './fixtures/pdv-module-fixture'
import {
  AnalyticsTransportFixture,
  type AnalyticsTransportFixture as AnalyticsTransportFixtureType,
} from './fixtures/analytics-transport-fixture'

export const test = playwrightTest.extend<{
  analyticsTransportFixture: AnalyticsTransportFixtureType
  identityFixture: IdentityModuleFixture
  communicationFixture: CommunicationModuleFixture
  mrpFixture: MrpFixture
  pdvFixture: PdvFixture
}>({
  analyticsTransportFixture: [
    async ({ page }, use) => {
      const fixture = AnalyticsTransportFixture(page)
      await fixture.install()
      await use(fixture)
    },
    { auto: true },
  ],
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
