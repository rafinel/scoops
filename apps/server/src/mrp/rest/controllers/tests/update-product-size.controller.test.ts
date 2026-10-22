import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  findSalesConfigurationPayloads,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
  setUpdatedAt,
  sortById,
} from './mrp-controller-test-helpers'

describe('Update Product Size Controller [PATCH /products/:productId/sizes/:sizeId]', () => {
  let fixture: MrpModuleFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('updates fields and status while returning the refreshed aggregate', async () => {
    const product = await fixture.addProduct(
      createProduct({ name: 'Update Portion', categories: [ProductCategory.Portion] }),
    )
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Original',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Other',
      quantity: 2,
      price: 20,
      isActive: true,
    })
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Updated', quantity: 1.125, price: 11.25, isActive: false })

    expect(response.status).toBe(200)
    expect(response.body.sizes).toContainEqual(
      expect.objectContaining({
        size: expect.objectContaining({
          id: size.id,
          name: 'Updated',
          quantity: 1.125,
          price: 11.25,
          isActive: false,
        }),
      }),
    )
    await expect(
      fixture.productSizes.findById(product.establishmentId, product.id, size.id),
    ).resolves.toMatchObject({ name: 'Updated', quantity: 1.125, isActive: false })
  })

  it('returns 409 and preserves the final active size during deactivation', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Final Active Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Only',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Only', quantity: 1, price: 10, isActive: false })

    expect(response.status).toBe(409)
    await expect(
      fixture.productSizes.findById(product.establishmentId, product.id, size.id),
    ).resolves.toMatchObject({ isActive: true })
  })

  it.each([
    ['a quantity at the numeric limit', { quantity: 1_000_000_000_000_000, price: 10 }],
    ['a price at the numeric limit', { quantity: 1, price: 10_000_000_000_000_000 }],
  ])('rejects %s and keeps the saved size', async (_name, values) => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Bound Update Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Existing',
      quantity: 1,
      price: 10,
      isActive: true,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Existing', isActive: true, ...values })

    expect(response.status).toBe(422)
    await expect(
      fixture.productSizes.findById(product.establishmentId, product.id, size.id),
    ).resolves.toMatchObject({ quantity: 1, price: 10 })
  })

  it('saves a price with two decimals and the smallest quantity', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Edge Update Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Existing',
      quantity: 1,
      price: 10,
      isActive: true,
    })

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Existing', quantity: 0.001, price: 1_234_567.89, isActive: true })

    expect(response.status).toBe(200)
    await expect(
      fixture.productSizes.findById(product.establishmentId, product.id, size.id),
    ).resolves.toMatchObject({ quantity: 0.001, price: 1_234_567.89 })
  })

  it('rejects malformed, duplicate, unauthorized, and foreign updates', async () => {
    const product = await fixture.addProduct(
      createProduct({
        name: 'Protected Update Portion',
        categories: [ProductCategory.Portion],
      }),
    )
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Existing',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const other = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Other',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const malformed = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Existing', quantity: 1.1234, price: 10, isActive: true })
    const duplicate = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: ' other ', quantity: 1, price: 10, isActive: true })
    const operator = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', operatorRequestAuthorization())
      .send({ name: 'Changed', quantity: 1, price: 10, isActive: true })
    const foreign = await request(fixture.app.getHttpServer())
      .patch(`/products/${product.id}/sizes/${size.id}`)
      .set('Cookie', foreignManagerRequestAuthorization())
      .send({ name: 'Changed', quantity: 1, price: 10, isActive: true })

    expect(malformed.status).toBe(422)
    expect(duplicate.status).toBe(409)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    await expect(
      fixture.productSizes.findById(product.establishmentId, product.id, other.id),
    ).resolves.toMatchObject({ name: 'Other' })
  })

  it('publishes the complete sales configuration with every accompaniment state', async () => {
    const establishmentId = MrpModuleFixture.accounts.establishmentId
    const portion = await fixture.addProduct(
      createProduct({ name: 'Payload Portion', categories: [ProductCategory.Portion] }),
    )
    const large = await fixture.addProductSize({
      establishmentId,
      productId: portion.id,
      name: 'Grande',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const small = await fixture.addProductSize({
      establishmentId,
      productId: portion.id,
      name: 'Pequeno',
      quantity: 0.5,
      price: 6,
      isActive: true,
    })
    const sauce = await fixture.addAccompanimentType({ establishmentId, name: 'Calda' })
    const topping = await fixture.addAccompanimentType({
      establishmentId,
      name: 'Cobertura',
    })
    const targets = {
      priced: await fixture.addProduct(
        createProduct({
          name: 'Granola',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 2.5,
        }),
      ),
      free: await fixture.addProduct(
        createProduct({
          name: 'Leite em pó',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 0,
        }),
      ),
      unpriced: await fixture.addProduct(
        createProduct({
          name: 'Paçoca',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 1,
        }),
      ),
      inactive: await fixture.addProduct(
        createProduct({
          name: 'Banana',
          categories: [ProductCategory.Accompaniment],
          accompanimentPrice: 3,
          status: 'inactive',
        }),
      ),
    }
    const links = {
      priced: await fixture.addProductAccompaniment({
        establishmentId,
        productId: portion.id,
        accompanimentProductId: targets.priced.id,
        accompanimentTypeId: sauce.id,
        quantityPerPortion: 1,
        accompanimentPrice: 2.5,
      }),
      free: await fixture.addProductAccompaniment({
        establishmentId,
        productId: portion.id,
        accompanimentProductId: targets.free.id,
        accompanimentTypeId: topping.id,
        quantityPerPortion: 1,
        accompanimentPrice: 0,
      }),
      unpriced: await fixture.addProductAccompaniment({
        establishmentId,
        productId: portion.id,
        accompanimentProductId: targets.unpriced.id,
        accompanimentTypeId: topping.id,
        quantityPerPortion: 1,
      }),
      inactive: await fixture.addProductAccompaniment({
        establishmentId,
        productId: portion.id,
        accompanimentProductId: targets.inactive.id,
        accompanimentTypeId: sauce.id,
        quantityPerPortion: 1,
        accompanimentPrice: 3,
      }),
    }
    const latestFact = new Date('2099-01-01T00:00:00.000Z')
    await setUpdatedAt(fixture, 'accompaniment_types', sauce.id, latestFact)

    const response = await request(fixture.app.getHttpServer())
      .patch(`/products/${portion.id}/sizes/${small.id}`)
      .set('Cookie', managerRequestAuthorization())
      .send({ name: 'Pequeno', quantity: 0.5, price: 6, isActive: false })

    expect(response.status).toBe(200)
    const accompaniments = sortById([
      links.priced,
      links.free,
      links.unpriced,
      links.inactive,
    ]).map((link) => {
      const entries = {
        [links.priced.id]: [targets.priced, sauce, 2.5, true],
        [links.free.id]: [targets.free, topping, 0, true],
        [links.unpriced.id]: [targets.unpriced, topping, 0, false],
        [links.inactive.id]: [targets.inactive, sauce, 3, false],
      } as const
      const [target, type, basePrice, isActive] = entries[link.id]
      return {
        accompanimentId: link.id,
        productId: target.id,
        name: target.name,
        type: type.name,
        basePrice,
        isActive,
      }
    })
    await expect(findSalesConfigurationPayloads(fixture)).resolves.toEqual([
      {
        establishmentId,
        productId: portion.id,
        state: 'available',
        configuration: {
          establishmentId,
          productId: portion.id,
          name: 'Payload Portion',
          categories: [ProductCategory.Portion],
          status: 'active',
          stockControl: 'single',
          sizes: [
            {
              sizeId: large.id,
              name: 'Grande',
              price: 10,
              isActive: true,
              accompaniments,
            },
            {
              sizeId: small.id,
              name: 'Pequeno',
              price: 6,
              isActive: false,
              accompaniments,
            },
          ],
          resaleConfigurations: [],
          updatedAt: latestFact.toISOString(),
        },
      },
    ])
  })
})
