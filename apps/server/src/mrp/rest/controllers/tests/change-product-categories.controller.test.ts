import type { Product } from '@scoops/core/mrp/domain/entities'
import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  expectedUpdatedAt,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Change Product Categories Controller [PATCH /products/:productId/categories]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('adds a valid category and returns the refreshed product settings', async () => {
    const product = await fixture.addProduct(createProduct())
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Ingredient, ProductCategory.Accompaniment],
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(200)
    expect(response.body.product.categories).toEqual([
      ProductCategory.Ingredient,
      ProductCategory.Accompaniment,
    ])
  })

  it('rejects Portion plus Accompaniment and keeps Accompaniment plus Resale valid', async () => {
    const portionCandidate = await fixture.addProduct(
      createProduct({ name: 'Portion Candidate' }),
    )
    const rejected = await request(fixture.app.getHttpServer())
      .patch(`/products/${portionCandidate.id}/categories`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        categories: [
          ProductCategory.Ingredient,
          ProductCategory.Portion,
          ProductCategory.Accompaniment,
        ],
        expectedUpdatedAt: expectedUpdatedAt(portionCandidate),
      })

    expect(rejected.status).toBe(400)
    await expect(
      fixture.products.findById(portionCandidate.establishmentId, portionCandidate.id),
    ).resolves.toMatchObject({ categories: [ProductCategory.Ingredient] })

    const validCandidate = await fixture.addProduct(
      createProduct({ name: 'Resale Accompaniment Candidate' }),
    )
    const allowed = await request(fixture.app.getHttpServer())
      .patch(`/products/${validCandidate.id}/categories`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Accompaniment, ProductCategory.Resale],
        expectedUpdatedAt: expectedUpdatedAt(validCandidate),
      })

    expect(allowed.status).toBe(200)
    expect(allowed.body.product.categories).toEqual([
      ProductCategory.Accompaniment,
      ProductCategory.Resale,
    ])
  })

  it('rechecks current dependencies and rolls back a blocked removal', async () => {
    const product = await fixture.addProduct(
      createProduct({
        categories: [ProductCategory.Ingredient, ProductCategory.Portion],
      }),
    )
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Current size',
      quantity: 0.5,
      price: 20,
      isActive: true,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Ingredient],
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(409)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({
      categories: [ProductCategory.Ingredient, ProductCategory.Portion],
    })
  })

  it('rejects manufacturable for products controlled by brand', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Ingredient, ProductCategory.Manufacturable],
        expectedUpdatedAt: expectedUpdatedAt(product),
      })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Produtos fabricáveis devem usar estoque único.')
  })

  it('rejects anonymous, operator, and foreign-establishment changes', async () => {
    const product = await fixture.addProduct(createProduct())
    const foreignProduct = await fixture.addProduct(
      createProduct({
        establishmentId: MrpModuleFixture.accounts.foreignEstablishmentId,
        name: 'Foreign Categories',
      }),
    )
    const body = {
      categories: [ProductCategory.Ingredient, ProductCategory.Accompaniment],
      expectedUpdatedAt: expectedUpdatedAt(product),
    }

    const anonymous = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .send(body)
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Cookie', operatorRequestAuthorization())
      .send(body)
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/products/${foreignProduct.id}/categories`)
      .set('Cookie', managerRequestAuthorization())
      .send({
        categories: [ProductCategory.Ingredient, ProductCategory.Accompaniment],
        expectedUpdatedAt: expectedUpdatedAt(foreignProduct),
      })
    const foreignManager = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/categories`)
      .set('Cookie', foreignManagerRequestAuthorization())
      .send(body)

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    expect(foreignManager.status).toBe(404)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toMatchObject({ categories: [ProductCategory.Ingredient] })
  })

  describe('global accompaniments', () => {
    async function setUpGlobal(portionCount = 1) {
      const target = await fixture.addProduct(
        createProduct({
          name: 'Category Global Target',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 3,
        }),
      )
      const type = await fixture.addAccompanimentType({
        establishmentId: target.establishmentId,
        name: 'Category Global Type',
      })
      const portions: Product[] = []
      for (let index = 0; index < portionCount; index++) {
        portions.push(
          await fixture.addProduct(
            createProduct({
              name: `Category Portion ${index}`,
              categories: [ProductCategory.Portion],
            }),
          ),
        )
      }
      const { global, rows } = await addGlobalAccompanimentWithRows(fixture, {
        target,
        type,
        portions,
        quantityPerPortion: 0.5,
      })
      return { target, type, portions, global, rows }
    }

    it('adds a row for every global to a product that gains the Portion category, whatever its status', async () => {
      const { target, type, global } = await setUpGlobal()
      const active = await fixture.addProduct(
        createProduct({ name: 'Becomes Portion Active' }),
      )
      const inactive = await fixture.addProduct(
        createProduct({ name: 'Becomes Portion Inactive', status: 'inactive' }),
      )

      for (const product of [active, inactive]) {
        const response = await request(fixture.app.getHttpServer())
          .patch(`/products/${product.id}/categories`)
          .set('Cookie', managerRequestAuthorization())
          .send({
            categories: [ProductCategory.Ingredient, ProductCategory.Portion],
            expectedUpdatedAt: expectedUpdatedAt(product),
          })
        expect(response.status).toBe(200)
        const rows = await fixture.productAccompaniments.findManyByProductId(
          product.establishmentId,
          product.id,
        )
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 0.5,
          globalAccompanimentId: global.id,
        })
      }
    })

    it('lets a Portion with only global rows lose the category and keeps the global elsewhere', async () => {
      const { global, portions } = await setUpGlobal(2)
      const leaving = await fixture.addProduct(
        createProduct({
          name: 'Leaving Portion',
          categories: [ProductCategory.Ingredient, ProductCategory.Portion],
        }),
      )
      await fixture.productAccompaniments.add({
        establishmentId: leaving.establishmentId,
        productId: leaving.id,
        accompanimentProductId: global.accompanimentProductId,
        accompanimentTypeId: global.accompanimentTypeId,
        quantityPerPortion: global.quantityPerPortion,
        globalAccompanimentId: global.id,
      })

      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${leaving.id}/categories`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          categories: [ProductCategory.Ingredient],
          expectedUpdatedAt: expectedUpdatedAt(leaving),
        })

      expect(response.status).toBe(200)
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          leaving.establishmentId,
          leaving.id,
        ),
      ).resolves.toEqual([])
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ id: global.id })
      for (const portion of portions) {
        await expect(
          fixture.productAccompaniments.findManyByProductId(
            portion.establishmentId,
            portion.id,
          ),
        ).resolves.toHaveLength(1)
      }
    })

    it('still blocks losing the Portion category while an individual row exists', async () => {
      const { global } = await setUpGlobal()
      const other = await fixture.addProduct(
        createProduct({
          name: 'Individual Blocker Target',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 1,
        }),
      )
      const leaving = await fixture.addProduct(
        createProduct({
          name: 'Blocked Leaving Portion',
          categories: [ProductCategory.Ingredient, ProductCategory.Portion],
        }),
      )
      await fixture.productAccompaniments.add({
        establishmentId: leaving.establishmentId,
        productId: leaving.id,
        accompanimentProductId: global.accompanimentProductId,
        accompanimentTypeId: global.accompanimentTypeId,
        quantityPerPortion: global.quantityPerPortion,
        globalAccompanimentId: global.id,
      })
      await fixture.productAccompaniments.add({
        establishmentId: leaving.establishmentId,
        productId: leaving.id,
        accompanimentProductId: other.id,
        accompanimentTypeId: global.accompanimentTypeId,
        quantityPerPortion: 1,
      })

      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${leaving.id}/categories`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          categories: [ProductCategory.Ingredient],
          expectedUpdatedAt: expectedUpdatedAt(leaving),
        })

      expect(response.status).toBe(409)
      await expect(
        fixture.productAccompaniments.findManyByProductId(
          leaving.establishmentId,
          leaving.id,
        ),
      ).resolves.toHaveLength(2)
      await expect(
        fixture.products.findById(leaving.establishmentId, leaving.id),
      ).resolves.toMatchObject({
        categories: [ProductCategory.Ingredient, ProductCategory.Portion],
      })
    })

    it('blocks losing the Accompaniment category while global rows exist', async () => {
      const { target, global, rows } = await setUpGlobal(2)
      const withAccompaniment = await fixture.products.findById(
        target.establishmentId,
        target.id,
      )
      if (!withAccompaniment) throw new Error('The target must exist.')

      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${target.id}/categories`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          categories: [ProductCategory.Ingredient],
          expectedUpdatedAt: expectedUpdatedAt(withAccompaniment),
        })

      expect(response.status).toBe(409)
      await expect(
        fixture.products.findById(target.establishmentId, target.id),
      ).resolves.toMatchObject({ categories: [ProductCategory.Accompaniment] })
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toMatchObject({ id: global.id })
      await expect(
        fixture.productAccompaniments.findManyByAccompanimentProductId(
          target.establishmentId,
          target.id,
        ),
      ).resolves.toHaveLength(rows.length)
    })

    it('deletes a global without rows when its product loses the Accompaniment category', async () => {
      const { target, global } = await setUpGlobal(0)
      const current = await fixture.products.findById(target.establishmentId, target.id)
      if (!current) throw new Error('The target must exist.')

      const response = await request(fixture.app.getHttpServer())
        .patch(`/products/${target.id}/categories`)
        .set('Cookie', managerRequestAuthorization())
        .send({
          categories: [ProductCategory.Ingredient],
          expectedUpdatedAt: expectedUpdatedAt(current),
        })

      expect(response.status).toBe(200)
      await expect(
        fixture.globalAccompaniments.findById(global.establishmentId, global.id),
      ).resolves.toBeUndefined()
      await expect(
        fixture.products.findById(target.establishmentId, target.id),
      ).resolves.toMatchObject({ categories: [ProductCategory.Ingredient] })
    })
  })
})
