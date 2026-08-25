import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { PreviewProductUnitChangeUseCase } from '#mrp/use-cases/preview-product-unit-change-use-case.ts'

const product = ProductFaker.fake({
  id: 'p1',
  establishmentId: 'e1',
  unit: ProductUnit.Gram,
})
const manager = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }

describe('Preview Product Unit Change Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: PreviewProductUnitChangeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findManyByProductId.mockResolvedValue([
      {
        id: 'b2',
        productId: 'p1',
        name: 'Zeta',
        packageQuantity: 1,
        packagePrice: 1,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'b1',
        productId: 'p1',
        name: 'Alpha',
        packageQuantity: 1,
        packagePrice: 1,
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    scope.stockBalancesRepository.countByProductId.mockResolvedValue(3)
    scope.recipesRepository.countByProductId.mockResolvedValue(1)
    scope.recipeIngredientsRepository.countByIngredientProductId.mockResolvedValue(2)
    scope.productSizesRepository.countByProductId.mockResolvedValue(4)
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      5,
    )
    useCase = new PreviewProductUnitChangeUseCase(database)
  })

  it('returns all affected current records without conversion factors', async () => {
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { targetUnit: ProductUnit.Kilogram },
      }),
    ).resolves.toEqual({
      currentUnit: ProductUnit.Gram,
      targetUnit: ProductUnit.Kilogram,
      affected: {
        balances: 3,
        brands: [
          { brandId: 'b1', brandName: 'Alpha' },
          { brandId: 'b2', brandName: 'Zeta' },
        ],
        recipeYields: 1,
        recipeIngredients: 2,
        sizes: 4,
        accompanimentLinks: 5,
        hasIdealStock: true,
        hasCurrentUnitCost: true,
      },
    })

    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      unit: ProductUnit.Unit,
      idealStock: undefined,
      currentUnitCost: undefined,
    })
    const preview = await useCase.execute({
      actor: manager,
      productId: product.id,
      input: { targetUnit: ProductUnit.Liter },
    })
    expect(preview).toEqual({
      currentUnit: ProductUnit.Unit,
      targetUnit: ProductUnit.Liter,
      affected: {
        balances: 3,
        brands: [
          { brandId: 'b1', brandName: 'Alpha' },
          { brandId: 'b2', brandName: 'Zeta' },
        ],
        recipeYields: 1,
        recipeIngredients: 2,
        sizes: 4,
        accompanimentLinks: 5,
        hasIdealStock: false,
        hasCurrentUnitCost: false,
      },
    })
  })

  it('rejects same-unit, foreign, invalid-unit, and operator requests', async () => {
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { targetUnit: ProductUnit.Gram },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { targetUnit: 'invalid' as ProductUnit },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: manager,
        productId: product.id,
        input: { targetUnit: ProductUnit.Kilogram },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: product.id,
        input: { targetUnit: ProductUnit.Kilogram },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
