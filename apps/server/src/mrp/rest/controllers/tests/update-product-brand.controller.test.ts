import { ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'
import {
  createProduct,
  managerRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Update Product Brand Controller [PATCH /products/:productId/brands/:brandId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture
  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('updates package configuration without changing stock', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Old',
      packageQuantity: 2,
      packagePrice: 20,
      isPrimary: true,
    })
    await fixture.balances.initialize(product.id, brand.id)
    await fixture.balances.add({ productId: product.id, brandId: brand.id }, 8)
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/brands/${brand.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'New', packageQuantity: 4, packageValue: 36 })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      brand: { name: 'New', packageQuantity: 4, packagePrice: 36 },
      stockQuantity: 8,
      unitPrice: 9,
    })
  })

  it('rejects duplicate names and preserves the original brand', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const first = await fixture.addBrand({
      productId: product.id,
      name: 'First',
      packageQuantity: 1,
      packagePrice: 1,
      isPrimary: true,
    })
    await fixture.addBrand({
      productId: product.id,
      name: 'Second',
      packageQuantity: 1,
      packagePrice: 1,
      isPrimary: false,
    })
    await fixture.balances.initialize(product.id, first.id)
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/brands/${first.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Second', packageQuantity: 2, packageValue: 3 })
    expect(response.status).toBe(409)
    await expect(fixture.brands.findById(product.id, first.id)).resolves.toMatchObject({
      name: 'First',
    })
  })
})
