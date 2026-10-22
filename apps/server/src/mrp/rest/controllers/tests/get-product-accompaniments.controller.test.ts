import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
} from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Get Product Accompaniments Controller [GET /products/:productId/accompaniments]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns current source projections in deterministic target order', async () => {
    const owner = await fixture.addProduct(
      createProduct({ name: 'Pistachio Portion', categories: [ProductCategory.Portion] }),
    )
    const singleTarget = await fixture.addProduct(
      createProduct({
        name: 'Granola',
        categories: [ProductCategory.Accompaniment],
        currentUnitCost: 2.5,
        accompanimentPrice: 1,
      }),
    )
    const byBrandTarget = await fixture.addProduct(
      createProduct({
        name: 'Molho',
        categories: [ProductCategory.Accompaniment],
        stockControl: ProductStockControl.ByBrand,
        currentUnitCost: undefined,
        accompanimentPrice: 1,
      }),
    )
    const unavailableTarget = await fixture.addProduct(
      createProduct({
        name: 'Unavailable',
        categories: [ProductCategory.Accompaniment],
        status: ProductStatus.Inactive,
        currentUnitCost: undefined,
        accompanimentPrice: 1,
      }),
    )
    const brand = await fixture.addBrand({
      productId: byBrandTarget.id,
      name: 'Main Source',
      packageQuantity: 2,
      packagePrice: 10,
      isPrimary: true,
    })
    const type = await fixture.addAccompanimentType({
      establishmentId: owner.establishmentId,
      name: 'Toppings',
    })

    await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: byBrandTarget.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
      accompanimentPrice: 0,
    })
    await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: unavailableTarget.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 3,
    })
    await fixture.addProductAccompaniment({
      establishmentId: owner.establishmentId,
      productId: owner.id,
      accompanimentProductId: singleTarget.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1.25,
      accompanimentPrice: 8.75,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${owner.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body.product).toMatchObject({ id: owner.id, name: owner.name })
    expect(response.body.accompaniments).toHaveLength(3)
    expect(
      response.body.accompaniments.map(
        (item: { accompanimentProductName: string }) => item.accompanimentProductName,
      ),
    ).toEqual(['Granola', 'Molho', 'Unavailable'])
    expect(response.body.accompaniments[0]).toMatchObject({
      accompanimentProductId: singleTarget.id,
      accompanimentTypeName: 'Toppings',
      quantityPerPortion: 1.25,
      unitCost: 2.5,
      estimatedCost: 3.125,
      salePrice: 8.75,
    })
    expect(response.body.accompaniments[1]).toMatchObject({
      accompanimentProductId: byBrandTarget.id,
      brandId: brand.id,
      brandName: 'Main Source',
      unitCost: 5,
      estimatedCost: 5,
      salePrice: 0,
    })
    expect(response.body.accompaniments[2]).not.toHaveProperty('unitCost')
    expect(response.body.accompaniments[2]).not.toHaveProperty('brandId')
    expect(response.body.accompaniments[2].salePrice).toBeNull()
    expect(response.body.product.createdAt).toEqual(expect.any(String))
  })

  it('returns the empty projection for a valid Portion and rejects invalid owners safely', async () => {
    const portion = await fixture.addProduct(
      createProduct({ name: 'Empty Portion', categories: [ProductCategory.Portion] }),
    )
    const ingredient = await fixture.addProduct(createProduct({ name: 'Ingredient' }))

    const empty = await request(fixture.app.getHttpServer())
      .get(`/products/${portion.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
    const invalidOwner = await request(fixture.app.getHttpServer())
      .get(`/products/${ingredient.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .get('/products/00000000-0000-4000-8000-000000000099/accompaniments')
      .set('Cookie', managerRequestAuthorization())

    expect(empty.status).toBe(200)
    expect(empty.body.accompaniments).toEqual([])
    expect(invalidOwner.status).toBe(400)
    expect(missing.status).toBe(404)
  })

  it('enforces authentication, Manager authorization, and tenant-safe not-found behavior', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Tenant Portion', categories: [ProductCategory.Portion] }),
    )
    const foreignProduct = await fixture.addProduct(
      createProduct({
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        categories: [ProductCategory.Portion],
      }),
    )

    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${product.id}/accompaniments`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/accompaniments`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .get(`/products/${foreignProduct.id}/accompaniments`)
      .set('Cookie', operatorRequestAuthorization())
    const missing = await request(fixture.app.getHttpServer())
      .get('/products/00000000-0000-4000-8000-000000000099/accompaniments')
      .set('Cookie', foreignManagerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(200)
    expect(operator.body.product.id).toBe(product.id)
    expect(foreign.status).toBe(404)
    expect(missing.status).toBe(404)
  })
  it('lists global rows first and then individual rows by name, flagging global and other-Portion links', async () => {
    const portion = await fixture.addProduct(
      createProduct({
        name: 'Global Table Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const otherPortion = await fixture.addProduct(
      createProduct({
        name: 'Other Table Portion',
        categories: [ProductCategory.Portion],
        status: ProductStatus.Inactive,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: portion.establishmentId,
      name: 'Toppings',
    })
    const targets = new Map<string, Awaited<ReturnType<typeof fixture.addProduct>>>()
    for (const name of ['Granola', 'Banana', 'Avela', 'Calda', 'Doce']) {
      targets.set(
        name,
        await fixture.addProduct(
          createProduct({
            name,
            categories: [ProductCategory.Accompaniment],
            accompanimentPrice: 3,
          }),
        ),
      )
    }
    const target = (name: string) => {
      const found = targets.get(name)
      if (!found) throw new Error(`Missing target ${name}`)
      return found
    }
    await addGlobalAccompanimentWithRows(fixture, {
      target: target('Granola'),
      type,
      portions: [portion, otherPortion],
      quantityPerPortion: 0.05,
      accompanimentPrice: 5,
    })
    await addGlobalAccompanimentWithRows(fixture, {
      target: target('Banana'),
      type,
      portions: [portion, otherPortion],
      quantityPerPortion: 0.08,
      accompanimentPrice: undefined,
    })
    for (const [name, linkedPortions] of [
      ['Doce', [portion]],
      ['Avela', [portion, otherPortion]],
      ['Calda', [portion]],
    ] as const) {
      for (const linkedPortion of linkedPortions) {
        await fixture.addProductAccompaniment({
          establishmentId: portion.establishmentId,
          productId: linkedPortion.id,
          accompanimentProductId: target(name).id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
          accompanimentPrice: linkedPortion.id === portion.id ? 4 : 6,
        })
      }
    }

    const manager = await request(fixture.app.getHttpServer())
      .get(`/products/${portion.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${portion.id}/accompaniments`)
      .set('Cookie', operatorRequestAuthorization())
    const inactivePortion = await request(fixture.app.getHttpServer())
      .get(`/products/${otherPortion.id}/accompaniments`)
      .set('Cookie', managerRequestAuthorization())

    expect(manager.status).toBe(200)
    expect(
      manager.body.accompaniments.map(
        (item: { accompanimentProductName: string; isGlobal: boolean }) =>
          `${item.accompanimentProductName}:${item.isGlobal}`,
      ),
    ).toEqual(['Banana:true', 'Granola:true', 'Avela:false', 'Calda:false', 'Doce:false'])
    expect(
      manager.body.accompaniments.map(
        (item: { accompanimentProductName: string; hasOtherPortionLinks: boolean }) =>
          `${item.accompanimentProductName}:${item.hasOtherPortionLinks}`,
      ),
    ).toEqual([
      'Banana:false',
      'Granola:false',
      'Avela:true',
      'Calda:false',
      'Doce:false',
    ])
    expect(manager.body.accompaniments[1]).toMatchObject({
      quantityPerPortion: 0.05,
      accompanimentTypeName: 'Toppings',
      salePrice: 5,
    })
    // A global row shows the global's own price (null when the global has none), and an
    // individual row shows its own link price rather than the Accompaniment product's default.
    expect(manager.body.accompaniments[0].salePrice).toBeNull()
    expect(
      manager.body.accompaniments.map(
        (item: { accompanimentProductName: string; salePrice: number | null }) =>
          `${item.accompanimentProductName}:${item.salePrice}`,
      ),
    ).toEqual(['Banana:null', 'Granola:5', 'Avela:4', 'Calda:4', 'Doce:4'])
    expect(operator.status).toBe(200)
    expect(operator.body.accompaniments).toEqual(manager.body.accompaniments)
    expect(inactivePortion.status).toBe(200)
    expect(
      inactivePortion.body.accompaniments.map(
        (item: { accompanimentProductName: string }) => item.accompanimentProductName,
      ),
    ).toEqual(['Banana', 'Granola', 'Avela'])
    expect(
      inactivePortion.body.accompaniments.map(
        (item: { salePrice: number | null }) => item.salePrice,
      ),
    ).toEqual([null, 5, 6])
  })
})
