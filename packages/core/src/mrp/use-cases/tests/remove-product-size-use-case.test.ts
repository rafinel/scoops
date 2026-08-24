import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker, ProductSizeFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { RemoveProductSizeUseCase } from '#mrp/use-cases/remove-product-size-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const product = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
})
const finalActiveSize = ProductSizeFaker.fake({
  id: 'size-final',
  establishmentId,
  productId: product.id,
  isActive: true,
})

describe('Remove Product Size Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RemoveProductSizeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productSizesRepository.findById.mockResolvedValue(finalActiveSize)
    useCase = new RemoveProductSizeUseCase(database)
  })

  it('removes an owned size, including the final active size, without an active-count guard', async () => {
    await expect(
      useCase.execute({ actor, productId: product.id, sizeId: finalActiveSize.id }),
    ).resolves.toBeUndefined()

    expect(scope.productSizesRepository.remove).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      finalActiveSize.id,
    )
    expect(scope.productSizesRepository.countActive).not.toHaveBeenCalled()
  })

  it('rejects operators, foreign sizes and non-Portion products before removal', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: product.id,
        sizeId: finalActiveSize.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    scope.productSizesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ actor, productId: product.id, sizeId: 'foreign-size' }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(scope.productSizesRepository.remove).not.toHaveBeenCalled()

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: 'resale-1',
        establishmentId,
        categories: [ProductCategory.Resale],
      }),
    )
    await expect(
      useCase.execute({ actor, productId: 'resale-1', sizeId: finalActiveSize.id }),
    ).rejects.toBeInstanceOf(BadRequestError)
  })
})
