import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'
import {
  createProduct,
  managerRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Remove Product Brand Controller [DELETE /products/:productId/brands/:brandId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture
  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('protects a primary brand with siblings and rolls the deletion back', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const primary = await fixture.addBrand({
      productId: product.id,
      name: 'Primary',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
    })
    await fixture.addBrand({
      productId: product.id,
      name: 'Other',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: false,
    })
    const response = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}/brands/${primary.id}`)
      .set('Cookie', managerRequestAuthorization())
    expect(response.status).toBe(409)
    await expect(fixture.brands.findById(product.id, primary.id)).resolves.toBeDefined()
  })

  it('removes the last brand and its balance while preserving ledger snapshots', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Historical',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
    })
    await fixture.balances.initialize(product.id, brand.id)
    await fixture.transactions.add({
      establishmentId: product.establishmentId,
      productId: product.id,
      brandId: brand.id,
      productName: product.name,
      brandName: brand.name,
      unit: product.unit,
      type: 'entry',
      quantity: 2,
      balanceAfter: 2,
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Maria Manager',
      occurredAt: new Date('2026-03-01T10:00:00.000Z'),
    })
    const response = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}/brands/${brand.id}`)
      .set('Cookie', managerRequestAuthorization())
    expect(response.status).toBe(204)
    await expect(fixture.brands.findById(product.id, brand.id)).resolves.toBeUndefined()
    const page = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      { page: 1, limit: 20 },
    )
    expect(page.items[0]).toMatchObject({ brandId: brand.id, brandName: 'Historical' })
  })
})
