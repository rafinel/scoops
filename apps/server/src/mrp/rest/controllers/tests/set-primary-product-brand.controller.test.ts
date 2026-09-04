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

describe('Set Primary Product Brand Controller [PATCH /products/:productId/brands/:brandId/primary]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture
  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('atomically exchanges the primary brand', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const first = await fixture.addBrand({
      productId: product.id,
      name: 'First',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
    })
    const second = await fixture.addBrand({
      productId: product.id,
      name: 'Second',
      packageQuantity: 2,
      packagePrice: 20,
      isPrimary: false,
    })
    await fixture.balances.initialize(product.id, second.id)
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/brands/${second.id}/primary`)
      .set('Cookie', managerRequestAuthorization())
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ brand: { id: second.id, isPrimary: true } })
    const brands = await fixture.brands.findManyByProductId(product.id)
    expect(brands.filter((brand) => brand.isPrimary).map((brand) => brand.id)).toEqual([
      second.id,
    ])
    expect(brands.find((brand) => brand.id === first.id)?.isPrimary).toBe(false)
  })

  it('returns not found for a foreign product without changing either tenant', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'First',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
    })
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/brands/${brand.id}/primary`)
      .set('Cookie', auth.cookieFor())
    expect(response.status).toBe(404)
    await expect(fixture.brands.findById(product.id, brand.id)).resolves.toMatchObject({
      isPrimary: true,
    })
  })
})
