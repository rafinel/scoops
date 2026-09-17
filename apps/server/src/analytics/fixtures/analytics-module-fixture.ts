import type { INestApplication } from '@nestjs/common'
import { AnalyticsModule } from '@/analytics/analytics.module'
import { RestFixture } from '@/shared/rest/tests/rest-fixture'

export class AnalyticsModuleFixture {
  private constructor(private readonly restFixture: RestFixture) {}

  static async register() {
    return new AnalyticsModuleFixture(
      await RestFixture.register({ imports: [AnalyticsModule] }),
    )
  }

  get app(): INestApplication {
    return this.restFixture.app
  }

  resetDatabase() {
    return this.restFixture.resetDatabase()
  }

  async close() {
    await this.restFixture.close()
  }
}
