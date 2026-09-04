import { ProductStockControl, ProductUnit } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  expectedUpdatedAt,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Change Product Unit Controller [PATCH /products/:productId/unit]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('updates the product unit while preserving product-owned values and brand configuration', async () => {
    const product = await fixture.addProduct(
      createProduct({
        stockControl: ProductStockControl.ByBrand,
        idealStock: 1.234,
        currentUnitCost: 2.5,
      }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Brand',
      packageQuantity: 2.5,
      packagePrice: 25,
      unit: ProductUnit.Kilogram,
      isPrimary: true,
    })
    await fixture.balances.initialize(product.id, brand.id)
    await fixture.balances.add({ productId: product.id, brandId: brand.id }, 3.25)

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/unit`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        targetUnit: ProductUnit.Gram,
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(200)
    expect(response.body.product).toMatchObject({
      id: product.id,
      unit: ProductUnit.Gram,
      idealStock: 1.234,
      currentUnitCost: 2.5,
    })
    await expect(
      fixture.brands.findById(product.establishmentId, product.id, brand.id),
    ).resolves.toMatchObject({
      packageQuantity: 2.5,
      unit: ProductUnit.Kilogram,
    })
    await expect(
      fixture.balances.findByProductAndBrand(product.id, brand.id),
    ).resolves.toMatchObject({ quantity: 3.25 })
  })

  it('allows a cross-dimension unit change without changing numeric values', async () => {
    const product = await fixture.addProduct(createProduct())
    await fixture.balances.initialize(product.id)
    await fixture.balances.add({ productId: product.id }, 1)

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/unit`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        targetUnit: ProductUnit.Unit,
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(200)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({
      unit: ProductUnit.Unit,
    })
    await expect(fixture.balances.findByProductId(product.id)).resolves.toMatchObject({
      quantity: 1,
    })
  })

  it('preserves every numeric value across multiple affected rows', async () => {
    const product = await fixture.addProduct(
      createProduct({
        stockControl: ProductStockControl.ByBrand,
        idealStock: 4,
        currentUnitCost: 2.4,
      }),
    )
    const firstBrand = await fixture.addBrand({
      productId: product.id,
      name: 'First brand',
      packageQuantity: 2,
      packagePrice: 20,
      unit: ProductUnit.Kilogram,
      isPrimary: true,
    })
    const secondBrand = await fixture.addBrand({
      productId: product.id,
      name: 'Second brand',
      packageQuantity: 3,
      packagePrice: 30,
      unit: ProductUnit.Kilogram,
      isPrimary: false,
    })
    await fixture.balances.initialize(product.id, firstBrand.id)
    await fixture.balances.initialize(product.id, secondBrand.id)
    await fixture.balances.add({ productId: product.id, brandId: firstBrand.id }, 4)
    await fixture.balances.add({ productId: product.id, brandId: secondBrand.id }, 5)

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/unit`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        targetUnit: ProductUnit.Gram,
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(200)
    expect(response.body.product).toMatchObject({
      unit: ProductUnit.Gram,
      idealStock: 4,
      currentUnitCost: 2.4,
    })
    await expect(
      fixture.brands.findById(product.establishmentId, product.id, firstBrand.id),
    ).resolves.toMatchObject({ packageQuantity: 2, unit: ProductUnit.Kilogram })
    await expect(
      fixture.brands.findById(product.establishmentId, product.id, secondBrand.id),
    ).resolves.toMatchObject({ packageQuantity: 3, unit: ProductUnit.Kilogram })
    await expect(
      fixture.balances.findByProductAndBrand(product.id, firstBrand.id),
    ).resolves.toMatchObject({ quantity: 4 })
    await expect(
      fixture.balances.findByProductAndBrand(product.id, secondBrand.id),
    ).resolves.toMatchObject({ quantity: 5 })
  })

  it('allows another cross-dimension unit change without changing current values', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const firstBrand = await fixture.addBrand({
      productId: product.id,
      name: 'First brand',
      packageQuantity: 2,
      packagePrice: 20,
      isPrimary: true,
    })
    const secondBrand = await fixture.addBrand({
      productId: product.id,
      name: 'Second brand',
      packageQuantity: 3,
      packagePrice: 30,
      isPrimary: false,
    })
    await fixture.balances.initialize(product.id, firstBrand.id)
    await fixture.balances.initialize(product.id, secondBrand.id)
    await fixture.balances.add({ productId: product.id, brandId: firstBrand.id }, 4)
    await fixture.balances.add({ productId: product.id, brandId: secondBrand.id }, 5)

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/unit`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        targetUnit: ProductUnit.Unit,
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(200)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({ unit: ProductUnit.Unit })
    await expect(
      fixture.brands.findById(product.establishmentId, product.id, secondBrand.id),
    ).resolves.toMatchObject({ packageQuantity: 3 })
    await expect(
      fixture.balances.findByProductAndBrand(product.id, secondBrand.id),
    ).resolves.toMatchObject({ quantity: 5 })
  })

  it('rejects anonymous, operator, and foreign-establishment changes', async () => {
    const product = await fixture.addProduct(createProduct())
    const body = {
      targetUnit: ProductUnit.Unit,
      expectedUpdatedAt: expectedUpdatedAt(product),
    }

    const anonymous = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/unit`)
      .send(body)
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/unit`)
      .set('Cookie', operatorRequestAuthorization())
      .send(body)
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/unit`)
      .set('Cookie', foreignManagerRequestAuthorization())
      .send(body)

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
  })
})
