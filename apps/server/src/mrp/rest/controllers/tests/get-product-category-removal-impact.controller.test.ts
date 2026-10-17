import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import type { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  addGlobalAccompanimentWithRows,
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Get Product Category Removal Impact Controller [GET /products/:productId/category-removal-impact]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('returns semantic portion dependencies from the owning establishment', async () => {
    const product = await fixture.addProduct(
      createProduct({
        categories: [ProductCategory.Ingredient, ProductCategory.Portion],
      }),
    )
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Small',
      quantity: 0.25,
      price: 10,
      isActive: true,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/category-removal-impact?category=portion`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      category: 'portion',
      canRemove: false,
      dependencies: [
        {
          kind: 'portion-size',
          productId: product.id,
          productName: product.name,
          sizeCount: 1,
        },
      ],
    })
  })

  it('excludes global rows from Portion dependencies and counts only individual rows', async () => {
    const globalTarget = await fixture.addProduct(
      createProduct({
        name: 'Impact Global Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 2,
      }),
    )
    const individualTarget = await fixture.addProduct(
      createProduct({
        name: 'Impact Individual Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 2,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: globalTarget.establishmentId,
      name: 'Impact Type',
    })
    const onlyGlobal = await fixture.addProduct(
      createProduct({
        name: 'Impact Only Global Portion',
        categories: [ProductCategory.Ingredient, ProductCategory.Portion],
      }),
    )
    const mixed = await fixture.addProduct(
      createProduct({
        name: 'Impact Mixed Portion',
        categories: [ProductCategory.Ingredient, ProductCategory.Portion],
      }),
    )
    await addGlobalAccompanimentWithRows(fixture, {
      target: globalTarget,
      type,
      portions: [onlyGlobal, mixed],
    })
    await fixture.addProductAccompaniment({
      establishmentId: mixed.establishmentId,
      productId: mixed.id,
      accompanimentProductId: individualTarget.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })

    const withoutDependencies = await request(fixture.app.getHttpServer())
      .get(`/products/${onlyGlobal.id}/category-removal-impact?category=portion`)
      .set('Cookie', managerRequestAuthorization())
    const withIndividualRow = await request(fixture.app.getHttpServer())
      .get(`/products/${mixed.id}/category-removal-impact?category=portion`)
      .set('Cookie', managerRequestAuthorization())

    expect(withoutDependencies.status).toBe(200)
    expect(withoutDependencies.body).toMatchObject({ canRemove: true, dependencies: [] })
    expect(withIndividualRow.status).toBe(200)
    expect(withIndividualRow.body.canRemove).toBe(false)
    expect(withIndividualRow.body.dependencies).toEqual([
      {
        kind: 'portion-accompaniment',
        productId: mixed.id,
        productName: mixed.name,
        linkCount: 1,
      },
    ])
  })

  it('reports every Portion using a global as an Accompaniment dependency', async () => {
    const target = await fixture.addProduct(
      createProduct({
        name: 'Impact Accompaniment Target',
        categories: [ProductCategory.Accompaniment],
        accompanimentPrice: 2,
      }),
    )
    const type = await fixture.addAccompanimentType({
      establishmentId: target.establishmentId,
      name: 'Impact Accompaniment Type',
    })
    const portions = [
      await fixture.addProduct(
        createProduct({ name: 'Impact A', categories: [ProductCategory.Portion] }),
      ),
      await fixture.addProduct(
        createProduct({ name: 'Impact B', categories: [ProductCategory.Portion] }),
      ),
    ]
    await addGlobalAccompanimentWithRows(fixture, { target, type, portions })

    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${target.id}/category-removal-impact?category=accompaniment`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(200)
    expect(response.body.canRemove).toBe(false)
    expect(response.body.dependencies).toHaveLength(2)
    expect(response.body.dependencies).toEqual(
      expect.arrayContaining(
        portions.map((portion) => ({
          kind: 'accompaniment-user',
          productId: portion.id,
          productName: portion.name,
        })),
      ),
    )
  })

  it('does not expose another establishment product or dependencies', async () => {
    const product = await fixture.addProduct(createProduct())
    const anonymous = await request(fixture.app.getHttpServer()).get(
      `/products/${product.id}/category-removal-impact?category=ingredient`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/category-removal-impact?category=ingredient`)
      .set('Cookie', operatorRequestAuthorization())
    const response = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/category-removal-impact?category=ingredient`)
      .set('Cookie', foreignManagerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(response.status).toBe(404)
  })
})
