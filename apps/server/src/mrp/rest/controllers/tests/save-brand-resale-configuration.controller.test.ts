import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { SupabaseAuthFixture } from '@/identity/fixtures/supabase-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Save Brand Resale Configuration Controller [PUT /products/:productId/brands/:brandId/resale-configuration]', () => {
  let fixture: MrpModuleFixture
  let auth: SupabaseAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('upserts only the owned brand configuration and preserves inherited packaging', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'By Brand Resale',
        categories: [ProductCategory.Resale],
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Brand One',
      packageQuantity: 3,
      packagePrice: 30,
      isPrimary: true,
    })
    const first = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/brands/${brand.id}/resale-configuration`)
      .set('Authorization', managerRequestAuthorization())
      .send({ price: 18.5, isActive: true })
    const configurationId = first.body.resale.find(
      (row: { brand?: { id: string } }) => row.brand?.id === brand.id,
    ).configuration.id
    const second = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/brands/${brand.id}/resale-configuration`)
      .set('Authorization', managerRequestAuthorization())
      .send({ price: 19.25, isActive: false })
    const read = await request(fixture.app.getHttpServer())
      .get(`/products/${product.id}/pricing`)
      .set('Authorization', managerRequestAuthorization())

    expect(first.status).toBe(200)
    expect(first.body.resale).toContainEqual(
      expect.objectContaining({
        brand: expect.objectContaining({ id: brand.id, packageQuantity: 3 }),
        packageQuantity: 3,
        price: 18.5,
        isActive: true,
      }),
    )
    expect(second.status).toBe(200)
    expect(read.status).toBe(200)
    expect(read.body.resale).toContainEqual(
      expect.objectContaining({
        brand: expect.objectContaining({ id: brand.id, packageQuantity: 3 }),
        packageQuantity: 3,
        price: 19.25,
        isActive: false,
        configuration: expect.objectContaining({ id: configurationId }),
      }),
    )
    await expect(
      fixture.resaleConfigurations.findManyByProductId(
        product.establishmentId,
        product.id,
      ),
    ).resolves.toHaveLength(1)
  })

  it('rejects missing or foreign brands, wrong mode, and malformed values', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Brand Validation',
        categories: [ProductCategory.Resale],
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const otherProduct = await fixture.addProduct(
      createProduct({
        name: 'Other Brand Owner',
        categories: [ProductCategory.Resale],
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const brand = await fixture.addBrand({
      productId: otherProduct.id,
      name: 'Other Brand',
      packageQuantity: 2,
      packagePrice: 20,
      isPrimary: true,
    })
    const missing = await request(fixture.app.getHttpServer())
      .put(
        `/products/${product.id}/brands/00000000-0000-4000-8000-000000000099/resale-configuration`,
      )
      .set('Authorization', managerRequestAuthorization())
      .send({ price: 10, isActive: true })
    const foreignBrand = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/brands/${brand.id}/resale-configuration`)
      .set('Authorization', managerRequestAuthorization())
      .send({ price: 10, isActive: true })
    const malformed = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/brands/${brand.id}/resale-configuration`)
      .set('Authorization', managerRequestAuthorization())
      .send({ price: 10.123, isActive: true })
    const single = await fixture.addProduct(
      createProduct({ name: 'Single Wrong Mode', categories: [ProductCategory.Resale] }),
    )
    const wrongMode = await request(fixture.app.getHttpServer())
      .put(`/products/${single.id}/brands/${brand.id}/resale-configuration`)
      .set('Authorization', managerRequestAuthorization())
      .send({ price: 10, isActive: true })

    expect(missing.status).toBe(404)
    expect(foreignBrand.status).toBe(404)
    expect(malformed.status).toBe(422)
    expect(wrongMode.status).toBe(400)
    await expect(
      fixture.resaleConfigurations.findManyByProductId(
        product.establishmentId,
        product.id,
      ),
    ).resolves.toHaveLength(0)
  })

  it('enforces authentication and tenant ownership', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Protected Brand Resale',
        categories: [ProductCategory.Resale],
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Protected Brand',
      packageQuantity: 1,
      packagePrice: 5,
      isPrimary: true,
    })
    const anonymous = await request(fixture.app.getHttpServer()).put(
      `/products/${product.id}/brands/${brand.id}/resale-configuration`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/brands/${brand.id}/resale-configuration`)
      .set('Authorization', operatorRequestAuthorization())
      .send({ price: 5, isActive: true })
    const foreign = await request(fixture.app.getHttpServer())
      .put(`/products/${product.id}/brands/${brand.id}/resale-configuration`)
      .set('Authorization', foreignManagerRequestAuthorization())
      .send({ price: 5, isActive: true })

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
  })
})
