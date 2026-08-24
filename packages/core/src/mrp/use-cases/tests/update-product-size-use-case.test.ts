import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker, ProductSizeFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { UpdateProductSizeUseCase } from '#mrp/use-cases/update-product-size-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const product = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
  currentUnitCost: undefined,
})
const size = ProductSizeFaker.fake({
  id: 'size-1',
  establishmentId,
  productId: product.id,
  name: 'Small',
  isActive: true,
})
const secondSize = ProductSizeFaker.fake({
  id: 'size-2',
  establishmentId,
  productId: product.id,
  name: 'Large',
  isActive: true,
})
const updatedSize = {
  ...size,
  name: 'Medium',
  quantity: 1.25,
  price: 11.5,
  isActive: false,
}

describe('Update Product Size Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: UpdateProductSizeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productSizesRepository.findById.mockResolvedValue(size)
    scope.productSizesRepository.findManyByProductId
      .mockResolvedValueOnce([size, secondSize])
      .mockResolvedValueOnce([updatedSize, secondSize])
    scope.productSizesRepository.countActive.mockResolvedValue(2)
    scope.productSizesRepository.replace.mockResolvedValue(updatedSize)
    useCase = new UpdateProductSizeUseCase(database)
  })

  it('normalizes and replaces editable fields, including status', async () => {
    const result = await useCase.execute({
      actor,
      productId: product.id,
      sizeId: size.id,
      input: { name: '  Medium  ', quantity: 1.25, price: 11.5, isActive: false },
    })

    expect(scope.productSizesRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      product.id,
      size.id,
      { name: 'Medium', quantity: 1.25, price: 11.5, isActive: false },
    )
    expect(result.sizes[0].size).toBe(updatedSize)
  })

  it('protects the final active size inside the transaction', async () => {
    scope.productSizesRepository.findManyByProductId.mockReset()
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size])
    scope.productSizesRepository.countActive.mockResolvedValue(1)

    await expect(
      useCase.execute({
        actor,
        productId: product.id,
        sizeId: size.id,
        input: { name: 'Small', quantity: 1, price: 10, isActive: false },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.productSizesRepository.countActive).toHaveBeenCalledWith(
      establishmentId,
      product.id,
    )
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects duplicate names, foreign sizes and non-Managers without partial writes', async () => {
    scope.productSizesRepository.findManyByProductId.mockReset()
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([size, secondSize])
    await expect(
      useCase.execute({
        actor,
        productId: product.id,
        sizeId: size.id,
        input: { name: ' large ', quantity: 1, price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.productSizesRepository.replace).not.toHaveBeenCalled()

    scope.productSizesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor,
        productId: product.id,
        sizeId: 'foreign-size',
        input: { name: 'Other', quantity: 1, price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: product.id,
        sizeId: size.id,
        input: { name: 'Other', quantity: 1, price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
