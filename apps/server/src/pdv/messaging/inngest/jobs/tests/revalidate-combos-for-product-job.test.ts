import { ProductSalesConfigurationChangedEvent } from '@scoops/core/mrp/domain/events'
import type { ProductCreate } from '@scoops/core/mrp/domain/structures'
import type { TelemetryProvider } from '@scoops/core/shared/interfaces'
import { EstablishmentFaker } from '@scoops/core/identity/domain/entities/fakers'
import { productSalesConfigurationChangedEventSchema } from '@scoops/validation'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { PdvModuleFixture, resetPdvFixture } from '@/pdv/fixtures/pdv-module-fixture'
import { RevalidateCombosForProductJob } from '@/pdv/messaging/inngest/jobs/revalidate-combos-for-product-job'
import { TELEMETRY } from '@/shared/provision/telemetry/sentry-telemetry-provider'

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
    const telemetry = fixture.get<TelemetryProvider>(TELEMETRY)
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

  it('keeps a Combo with a global accompaniment active and deactivates it when the global row disappears from the Portion', async () => {
    const establishmentId = TEST_ESTABLISHMENT_ID
    const { portion, size, row, combo } = await createPortionComboWithGlobal(
      fixture,
      establishmentId,
    )
    const configurationFor = (accompaniments: readonly (typeof row)[]) => ({
      establishmentId,
      productId: portion.id,
      name: portion.name,
      categories: ['portion' as const],
      status: 'active' as const,
      stockControl: 'single' as const,
      sizes: [
        {
          sizeId: size.id,
          name: size.name,
          price: size.price,
          isActive: true,
          accompaniments: accompaniments.map((item) => ({
            accompanimentId: item.id,
            productId: item.accompanimentProductId,
            name: 'Global topping',
            type: 'Toppings',
            basePrice: 3.5,
            isActive: true,
          })),
        },
      ],
      resaleConfigurations: [],
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    const kept = new ProductSalesConfigurationChangedEvent({
      establishmentId,
      productId: portion.id,
      state: 'available',
      configuration: configurationFor([row]),
    })
    const removed = new ProductSalesConfigurationChangedEvent({
      establishmentId,
      productId: portion.id,
      state: 'available',
      configuration: configurationFor([]),
    })

    const keptRun = await fixture.runInngest({ name: kept.name, data: kept.payload })
    const statusAfterKeep = await fixture.discounts.findById(establishmentId, combo.id)
    const removedRun = await fixture.runInngest({
      name: removed.name,
      data: removed.payload,
    })

    expect(keptRun.status.toLowerCase()).toBe('completed')
    expect(statusAfterKeep).toMatchObject({ status: 'active' })
    expect(removedRun.status.toLowerCase()).toBe('completed')
    await expect(
      fixture.discounts.findById(establishmentId, combo.id),
    ).resolves.toMatchObject({ status: 'inactive' })
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

async function createPortionComboWithGlobal(
  fixture: PdvModuleFixture,
  establishmentId: string,
) {
  await fixture.get(IdentitySeeder).run({
    establishments: [EstablishmentFaker.fake({ id: establishmentId })],
    users: [],
    registrationAttempts: [],
  })
  const portion = await fixture.addProduct(
    productCreate({
      establishmentId,
      name: 'Global Job Portion',
      categories: ['portion'],
      currentUnitCost: 2,
    }),
  )
  const size = await fixture.addProductSize({
    establishmentId,
    productId: portion.id,
    name: 'Regular',
    quantity: 1,
    price: 10,
    isActive: true,
  })
  const target = await fixture.addProduct(
    productCreate({
      establishmentId,
      name: 'Global Job Topping',
      categories: ['accompaniment'],
      accompanimentPrice: 3.5,
    }),
  )
  const type = await fixture.addAccompanimentType({
    establishmentId,
    name: 'Toppings',
  })
  const global = await fixture.addGlobalAccompaniment({
    establishmentId,
    accompanimentProductId: target.id,
    accompanimentTypeId: type.id,
    quantityPerPortion: 0.5,
  })
  const row = await fixture.addProductAccompaniment({
    establishmentId,
    productId: portion.id,
    accompanimentProductId: target.id,
    accompanimentTypeId: type.id,
    quantityPerPortion: 0.5,
    globalAccompanimentId: global.id,
  })
  const resale = await fixture.addProduct(
    productCreate({ establishmentId, name: 'Global Job Resale' }),
  )
  const combo = await fixture.addCombo({
    establishmentId,
    name: 'Global Job Combo',
    status: 'active',
    fixedPrice: 15,
    components: [
      {
        kind: 'portion',
        productId: portion.id,
        quantity: 1,
        sizeId: size.id,
        accompanimentIds: [row.id],
      },
      { kind: 'resale', productId: resale.id, quantity: 1 },
    ],
  })

  return { portion, size, row, combo }
}
