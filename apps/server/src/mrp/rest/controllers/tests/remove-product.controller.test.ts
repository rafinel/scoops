import { ConflictError } from '@scoops/core/shared/domain/errors'
import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import request from 'supertest'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import type { BetterAuthFixture } from '@/identity/fixtures/better-auth-fixture'
import { DrizzleProductsRepository } from '@/mrp/database/drizzle/repositories/drizzle-products-repository'
import { MrpModuleFixture } from '@/mrp/fixtures/mrp-module-fixture'
import type { MrpModuleFixture as MrpFixture } from '@/mrp/fixtures/mrp-module-fixture'

import {
  createProduct,
  foreignManagerRequestAuthorization,
  managerRequestAuthorization,
  operatorRequestAuthorization,
  prepareMrpFixture,
  resetMrpFixture,
} from './mrp-controller-test-helpers'

describe('Remove Product Controller [DELETE /products/:productId]', () => {
  let fixture: MrpFixture
  let auth: BetterAuthFixture

  beforeAll(async () => ({ fixture, auth } = await prepareMrpFixture()))
  beforeEach(async () => resetMrpFixture(fixture, auth))
  afterEach(() => vi.restoreAllMocks())
  afterAll(async () => fixture?.close())

  it('removes every current dependency and retains stock and production history', async () => {
    const product = await fixture.addProduct(
      createProduct({
        categories: [
          ProductCategory.Ingredient,
          ProductCategory.Accompaniment,
          ProductCategory.Resale,
        ],
        stockControl: ProductStockControl.ByBrand,
      }),
    )
    const ingredient = await fixture.addProduct(
      createProduct({ name: 'Recipe ingredient' }),
    )
    const consumer = await fixture.addProduct(
      createProduct({
        name: 'Consumer product',
        categories: [ProductCategory.Manufacturable],
      }),
    )
    const portion = await fixture.addProduct(
      createProduct({
        name: 'Portion product',
        categories: [ProductCategory.Portion],
      }),
    )
    const accompaniment = await fixture.addProduct(
      createProduct({ name: 'Owned accompaniment' }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Retained brand',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
    })
    await fixture.balances.initialize(product.id, brand.id)
    await fixture.balances.add({ productId: product.id, brandId: brand.id }, 2)
    await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Current size',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    await fixture.addResaleConfiguration({
      establishmentId: product.establishmentId,
      productId: product.id,
      brandId: brand.id,
      price: 12,
      isActive: true,
    })
    const type = await fixture.addAccompanimentType({
      establishmentId: product.establishmentId,
      name: 'Topping',
    })
    const ownedLink = await fixture.addProductAccompaniment({
      establishmentId: product.establishmentId,
      productId: product.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    const inverseLink = await fixture.addProductAccompaniment({
      establishmentId: product.establishmentId,
      productId: portion.id,
      accompanimentProductId: product.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1,
    })
    const ownedRecipe = await fixture.addRecipe({
      establishmentId: product.establishmentId,
      productId: product.id,
      yieldQuantity: 2,
    })
    const ownedRecipeIngredient = await fixture.addRecipeIngredient({
      establishmentId: product.establishmentId,
      recipeId: ownedRecipe.id,
      ingredientProductId: ingredient.id,
      quantity: 0.5,
    })
    const consumerRecipe = await fixture.addRecipe({
      establishmentId: product.establishmentId,
      productId: consumer.id,
      yieldQuantity: 1,
    })
    const consumingRecipeIngredient = await fixture.addRecipeIngredient({
      establishmentId: product.establishmentId,
      recipeId: consumerRecipe.id,
      ingredientProductId: product.id,
      quantity: 0.25,
    })
    const production = await fixture.addProduction({
      establishmentId: product.establishmentId,
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      recipeId: ownedRecipe.id,
      recipeYield: 2,
      quantity: 2,
      totalCost: 4,
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Maria Manager',
      occurredAt: new Date('2026-08-02T10:00:00.000Z'),
    })
    await fixture.addProductionIngredients([
      {
        establishmentId: product.establishmentId,
        productionId: production.id,
        ingredientProductId: ingredient.id,
        ingredientProductName: ingredient.name,
        unit: ingredient.unit,
        quantity: 0.5,
        unitCost: 2,
        lineCost: 1,
        balanceAfter: 4.5,
      },
    ])
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
      occurredAt: new Date('2026-08-02T10:00:00.000Z'),
    })
    await fixture.transactions.add({
      establishmentId: product.establishmentId,
      productId: product.id,
      brandId: brand.id,
      productionId: production.id,
      productName: product.name,
      brandName: brand.name,
      unit: product.unit,
      type: 'production-output',
      quantity: 2,
      balanceAfter: 4,
      performedBy: MrpModuleFixture.accounts.managerId,
      performedByName: 'Maria Manager',
      occurredAt: new Date('2026-08-03T10:00:00.000Z'),
    })

    const response = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(204)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toBeUndefined()
    await expect(
      fixture.brands.findById(product.establishmentId, product.id, brand.id),
    ).resolves.toBeUndefined()
    await expect(
      fixture.balances.findByProductAndBrand(product.id, brand.id),
    ).resolves.toBeUndefined()
    await expect(
      fixture.productSizes.findManyByProductId(product.establishmentId, product.id),
    ).resolves.toEqual([])
    await expect(
      fixture.resaleConfigurations.findManyByProductId(
        product.establishmentId,
        product.id,
      ),
    ).resolves.toEqual([])
    await expect(
      fixture.productAccompaniments.findManyByProductId(
        product.establishmentId,
        product.id,
      ),
    ).resolves.toEqual([])
    await expect(
      fixture.productAccompaniments.findManyByAccompanimentProductId(
        product.establishmentId,
        product.id,
      ),
    ).resolves.toEqual([])
    await expect(
      fixture.recipes.findByProductId(product.establishmentId, product.id),
    ).resolves.toBeUndefined()
    await expect(
      fixture.recipeIngredients.findByRecipeId(product.establishmentId, ownedRecipe.id),
    ).resolves.toEqual([])
    await expect(
      fixture.recipeIngredients.findManyByIngredientProductId(
        product.establishmentId,
        product.id,
      ),
    ).resolves.toEqual([])
    await expect(
      fixture.products.findById(consumer.establishmentId, consumer.id),
    ).resolves.toBeDefined()
    await expect(
      fixture.recipes.findByProductId(consumer.establishmentId, consumer.id),
    ).resolves.toMatchObject({ id: consumerRecipe.id })
    await expect(
      fixture.recipeIngredients.findById(
        consumer.establishmentId,
        consumerRecipe.id,
        consumingRecipeIngredient.id,
      ),
    ).resolves.toBeUndefined()
    await expect(
      fixture.productAccompaniments.findById(
        portion.establishmentId,
        portion.id,
        inverseLink.id,
      ),
    ).resolves.toBeUndefined()
    await expect(
      fixture.productAccompaniments.findById(
        product.establishmentId,
        product.id,
        ownedLink.id,
      ),
    ).resolves.toBeUndefined()
    await expect(
      fixture.recipeIngredients.findById(
        product.establishmentId,
        ownedRecipe.id,
        ownedRecipeIngredient.id,
      ),
    ).resolves.toBeUndefined()
    await expect(
      fixture.products.findById(accompaniment.establishmentId, accompaniment.id),
    ).resolves.toBeDefined()

    const history = await fixture.transactions.findPage(
      product.establishmentId,
      product.id,
      {
        page: 1,
        limit: 20,
      },
    )
    expect(history.items).toHaveLength(2)
    expect(history.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: product.id,
          productName: product.name,
          brandName: brand.name,
        }),
        expect.objectContaining({
          productId: product.id,
          productionId: production.id,
          type: 'production-output',
        }),
      ]),
    )
    await expect(
      fixture.productions.countByProductId(product.establishmentId, product.id),
    ).resolves.toBe(1)
  })

  it('rolls back all current dependency removal when the final delete fails', async () => {
    const product = await fixture.addProduct(
      createProduct({ stockControl: ProductStockControl.ByBrand }),
    )
    const brand = await fixture.addBrand({
      productId: product.id,
      name: 'Rollback brand',
      packageQuantity: 1,
      packagePrice: 10,
      isPrimary: true,
    })
    await fixture.balances.initialize(product.id, brand.id)
    await fixture.balances.add({ productId: product.id, brandId: brand.id }, 2)
    const size = await fixture.addProductSize({
      establishmentId: product.establishmentId,
      productId: product.id,
      name: 'Rollback size',
      quantity: 1,
      price: 10,
      isActive: true,
    })
    const resaleConfiguration = await fixture.addResaleConfiguration({
      establishmentId: product.establishmentId,
      productId: product.id,
      price: 12,
      isActive: true,
    })

    // The HTTP request and transaction remain real; this concrete repository boundary
    // injection deterministically fails after dependent deletes to prove rollback.
    vi.spyOn(DrizzleProductsRepository.prototype, 'remove').mockRejectedValueOnce(
      new ConflictError('Injected database failure'),
    )

    const response = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}`)
      .set('Cookie', managerRequestAuthorization())

    expect(response.status).toBe(409)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toBeDefined()
    await expect(
      fixture.brands.findById(product.establishmentId, product.id, brand.id),
    ).resolves.toBeDefined()
    await expect(
      fixture.balances.findByProductAndBrand(product.id, brand.id),
    ).resolves.toMatchObject({ quantity: 2 })
    await expect(
      fixture.productSizes.findById(product.establishmentId, product.id, size.id),
    ).resolves.toBeDefined()
    await expect(
      fixture.resaleConfigurations.findById(
        product.establishmentId,
        product.id,
        resaleConfiguration.id,
      ),
    ).resolves.toBeDefined()
  })

  it('rejects anonymous, operator, and foreign-establishment removal', async () => {
    const product = await fixture.addProduct(createProduct())
    const anonymous = await request(fixture.app.getHttpServer()).delete(
      `/products/${product.id}`,
    )
    const operator = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}`)
      .set('Cookie', operatorRequestAuthorization())
    const foreign = await request(fixture.app.getHttpServer())
      .delete(`/products/${product.id}`)
      .set('Cookie', foreignManagerRequestAuthorization())

    expect(anonymous.status).toBe(401)
    expect(operator.status).toBe(403)
    expect(foreign.status).toBe(404)
    await expect(
      fixture.products.findById(product.establishmentId, product.id),
    ).resolves.toBeDefined()
  })
})
