import { ProductSalesConfigurationChangedEvent } from '@scoops/core/mrp/domain/events'
import type { ProductCreate } from '@scoops/core/mrp/domain/structures'
import type { Telemetry } from '@scoops/core/shared/interfaces'
import { EstablishmentFaker } from '@scoops/core/identity/domain/entities/fakers'
import { productSalesConfigurationChangedEventSchema } from '@scoops/validation'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { PdvModuleFixture, resetPdvFixture } from '@/pdv/fixtures/pdv-module-fixture'
import { RevalidateCombosForProductJob } from '@/pdv/messaging/inngest/jobs/revalidate-combos-for-product-job'
import { TELEMETRY } from '@/shared/provision/telemetry/server-app-telemetry-provider'

const TEST_ESTABLISHMENT_ID = '45000000-0000-4000-8000-000000000001'

describe('Revalidate Combos For Product Job', () => {
  let fixture: PdvModuleFixture
  let auth: BetterAuthFixture
  let recordJobRun: ReturnType<typeof vi.spyOn>
  let captureUnexpected: ReturnType<typeof vi.spyOn>

  beforeAll(async () => {
    auth = new BetterAuthFixture()
    fixture = await PdvModuleFixture.register(auth, {
      inngestJob: RevalidateCombosForProductJob,
    })
  })

  beforeEach(async () => {
    vi.restoreAllMocks()
    await resetPdvFixture(fixture, auth)
    const telemetry = fixture.get<Telemetry>(TELEMETRY)
    recordJobRun = vi.spyOn(telemetry, 'recordJobRun')
    captureUnexpected = vi.spyOn(telemetry, 'captureUnexpected')
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await fixture?.close()
  })

  it('registers the validated event and tenant-product concurrency key', () => {
    expect(fixture.inngestFunctionOptions).toMatchObject({
      id: RevalidateCombosForProductJob.ID,
      concurrency: {
        limit: 1,
        key: 'event.data.establishmentId + ":" + event.data.productId',
      },
    })
    expect(fixture.inngestFunctionOptions.triggers).toHaveLength(1)
    expect(
      productSalesConfigurationChangedEventSchema.safeParse({
        establishmentId: 'not-a-uuid',
        productId: PdvModuleFixture.accounts.managerId,
        state: 'deleted',
        configuration: null,
      }).success,
    ).toBe(false)
  })

  it('revalidates persisted combos through Inngest and records one safe terminal outcome', async () => {
    const establishmentId = TEST_ESTABLISHMENT_ID
    const { product, combo } = await createCombo(fixture, establishmentId)
    const event = new ProductSalesConfigurationChangedEvent({
      establishmentId,
      productId: product.id,
      state: 'deleted',
      configuration: null,
    })

    const run = await fixture.runInngest({ name: event.name, data: event.payload })

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(RevalidateCombosForProductJob.ID)
    await expect(
      fixture.discounts.findById(establishmentId, combo.id),
    ).resolves.toMatchObject({
      status: 'inactive',
    })
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: RevalidateCombosForProductJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(establishmentId)
    expect(JSON.stringify(recordJobRun.mock.calls)).not.toContain(product.id)
    expect(captureUnexpected).not.toHaveBeenCalled()
  })

  it('keeps valid combos active when a product configuration is available', async () => {
    const establishmentId = TEST_ESTABLISHMENT_ID
    const { product, combo } = await createCombo(fixture, establishmentId)
    const event = new ProductSalesConfigurationChangedEvent({
      establishmentId,
      productId: product.id,
      state: 'available',
      configuration: {
        establishmentId,
        productId: product.id,
        name: product.name,
        categories: ['resale'],
        status: 'active',
        stockControl: 'single',
        sizes: [],
        resaleConfigurations: [{ price: 20, isActive: true }],
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    })

    const run = await fixture.runInngest({
      name: event.name,
      data: event.payload,
    })

    expect(run.status.toLowerCase()).toBe('completed')
    expect(run.function?.id).toBe(RevalidateCombosForProductJob.ID)
    await expect(
      fixture.discounts.findById(establishmentId, combo.id),
    ).resolves.toMatchObject({ status: 'active' })
    expect(recordJobRun).toHaveBeenCalledTimes(1)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: RevalidateCombosForProductJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(captureUnexpected).not.toHaveBeenCalled()
  })

  it('leaves deleted references inactive across repeated event deliveries', async () => {
    const establishmentId = TEST_ESTABLISHMENT_ID
    const { product, combo } = await createCombo(fixture, establishmentId)
    const event = new ProductSalesConfigurationChangedEvent({
      establishmentId,
      productId: product.id,
      state: 'deleted',
      configuration: null,
    })
    const firstRun = await fixture.runInngest({
      name: event.name,
      data: event.payload,
    })
    const secondRun = await fixture.runInngest({
      name: event.name,
      data: event.payload,
    })

    expect(firstRun.status.toLowerCase()).toBe('completed')
    expect(secondRun.status.toLowerCase()).toBe('completed')
    await expect(
      fixture.discounts.findById(establishmentId, combo.id),
    ).resolves.toMatchObject({ status: 'inactive' })
    expect(recordJobRun).toHaveBeenCalledTimes(2)
    expect(recordJobRun).toHaveBeenCalledWith({
      functionId: RevalidateCombosForProductJob.ID,
      outcome: 'success',
      durationMs: expect.any(Number),
    })
    expect(captureUnexpected).not.toHaveBeenCalled()
  })
})

function productCreate(overrides: Partial<ProductCreate> = {}): ProductCreate {
  return {
    establishmentId: TEST_ESTABLISHMENT_ID,
    name: 'Chocolate',
    unit: 'un',
    categories: ['resale'],
    stockControl: 'single',
    status: 'active',
    allowNegativeStock: false,
    ...overrides,
  }
}

async function createCombo(fixture: PdvModuleFixture, establishmentId: string) {
  await fixture.get(IdentitySeeder).run({
    establishments: [EstablishmentFaker.fake({ id: establishmentId })],
    users: [],
    registrationAttempts: [],
  })
  const product = await fixture.addProduct(productCreate({ establishmentId }))
  const secondProduct = await fixture.addProduct(
    productCreate({ establishmentId, name: 'Vanilla' }),
  )
  const combo = await fixture.addCombo({
    establishmentId,
    name: 'Chocolate Combo',
    status: 'active',
    fixedPrice: 15,
    components: [
      { kind: 'resale', productId: product.id, quantity: 1 },
      { kind: 'resale', productId: secondProduct.id, quantity: 1 },
    ],
  })

  return { combo, product }
}
