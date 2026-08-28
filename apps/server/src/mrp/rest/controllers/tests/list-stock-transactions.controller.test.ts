import type { StockTransaction } from '@scoops/core/mrp/domain/entities'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'
import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('List Stock Transactions Controller [GET /products/:productId/stock-transactions]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture
  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('filters and pages own transactions in stable newest-first order', async () => {
    const product = await fixture.addProduct(createProduct())
    const records: StockTransaction[] = [
      createTransaction({
        establishmentId: product.establishmentId,
        productId: product.id,
        productName: 'Historical Chocolate',
        type: 'entry',
        quantity: 2,
        balanceAfter: 2,
        performedBy: MrpModuleFixture.accounts.managerId,
        performedByName: 'Maria Historical',
        occurredAt: new Date('2026-03-01T10:00:00.000Z'),
      }),
      createTransaction({
        establishmentId: product.establishmentId,
        productId: product.id,
        productName: 'Historical Chocolate',
        type: 'write-off',
        quantity: 1,
        balanceAfter: 1,
        performedBy: MrpModuleFixture.accounts.managerId,
        performedByName: 'Maria Historical',
        occurredAt: new Date('2026-03-02T10:00:00.000Z'),
      }),
      createTransaction({
        establishmentId: product.establishmentId,
        productId: product.id,
        productName: 'Historical Chocolate',
        type: 'entry',
        quantity: 4,
        balanceAfter: 5,
        performedBy: MrpModuleFixture.accounts.managerId,
        performedByName: 'Maria Historical',
        occurredAt: new Date('2026-03-03T10:00:00.000Z'),
      }),
    ]
    for (const { id: _id, ...record } of records) await fixture.transactions.add(record)
    const response = await request(fixture.app.getHttpServer())
      .get(
        `/products/${product.id}/stock-transactions?type=entry&from=2026-03-01T00:00:00.000Z&to=2026-03-03T23:59:59.999Z&page=1&limit=1`,
      )
      .set('Authorization', managerRequestAuthorization())
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      items: [
        {
          quantity: 4,
          productName: 'Historical Chocolate',
          performedByName: 'Maria Historical',
        },
      ],
    })
    expect(response.body.items[0].occurredAt).toBe('2026-03-03T10:00:00.000Z')
  })

  it('preserves captured brand and author facts after the source brand is renamed and deleted', async () => {
    const product = await fixture.addProduct(createProduct())
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Captured Brand',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
    })
    const { id: _id, ...transaction } = createTransaction({
      establishmentId: product.establishmentId,
      productId: product.id,
      brandId: brand.id,
      productName: 'Captured Product',
      brandName: 'Captured Brand',
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Captured Author',
    })
    await fixture.transactions.add(transaction)
    await fixture.brands.replace(product.id, brand.id, { name: 'Renamed Brand' })
    await fixture.brands.remove(product.id, brand.id)
    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock-transactions?page=1&limit=20`)
      .set('Authorization', managerRequestAuthorization())
    expect(response.body.items[0]).toMatchObject({
      brandId: brand.id,
      brandName: 'Captured Brand',
      productName: 'Captured Product',
      performedByName: 'Captured Author',
    })
  })

  it('filters sale history and returns its nullable order correlation', async () => {
    const product = await fixture.addProduct(createProduct())
    const orderId = crypto.randomUUID()
    const { id: _id, ...transaction } = createTransaction({
      establishmentId: product.establishmentId,
      productId: product.id,
      type: 'sale',
      orderId,
      productName: 'Sold Chocolate',
    })
    await fixture.transactions.add(transaction)

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock-transactions?type=sale&page=1&limit=20`)
      .set('Authorization', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      total: 1,
      items: [
        {
          type: 'sale',
          orderId,
          productName: 'Sold Chocolate',
        },
      ],
    })
  })

  it('returns uniform not-found for foreign and missing products', async () => {
    const product = await fixture.addProduct(createProduct())
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/stock-transactions?page=1&limit=20`)
      .set('Authorization', foreignManagerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .get(
        '/products/00000000-0000-4000-8000-000000000099/stock-transactions?page=1&limit=20',
      )
      .set('Authorization', managerRequestAuthorization())
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
    expect(foreign.body.title).toBe(missing.body.title)
  })
})

function createTransaction(overrides: Partial<StockTransaction> = {}): StockTransaction {
  return {
    id: crypto.randomUUID(),
    establishmentId: MrpModuleFixture.accounts.establishmentId,
    productId: crypto.randomUUID(),
    productName: 'Chocolate',
    unit: 'kg',
    type: 'entry',
    quantity: 1,
    balanceAfter: 1,
    performedBy: MrpModuleFixture.accounts.managerId,
    performedByName: 'Maria Manager',
    occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}
