import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker, ProductSizeFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { RegisterProductSizeUseCase } from '#mrp/use-cases/register-product-size-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const product = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
  currentUnitCost: undefined,
})
const existingSize = ProductSizeFaker.fake({
  id: 'size-existing',
  establishmentId,
  productId: product.id,
  name: 'Small',
})
const addedSize = ProductSizeFaker.fake({
  id: 'size-added',
  establishmentId,
  productId: product.id,
  name: 'Medium',
  quantity: 1.5,
  price: 12.5,
})

describe('Register Product Size Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: RegisterProductSizeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.productSizesRepository.findManyByProductId
      .mockResolvedValueOnce([existingSize])
      .mockResolvedValueOnce([existingSize, addedSize])
    scope.productSizesRepository.add.mockResolvedValue(addedSize)
    useCase = new RegisterProductSizeUseCase(database)
  })

  it('normalizes the name, adds an active size and returns refreshed pricing', async () => {
    const result = await useCase.execute({
      actor,
      productId: product.id,
      input: { name: '  Medium  ', quantity: 1.5, price: 12.5 },
    })

    expect(scope.productSizesRepository.add).toHaveBeenCalledWith({
      establishmentId,
      productId: product.id,
      name: 'Medium',
      quantity: 1.5,
      price: 12.5,
      isActive: true,
    })
    expect(result.sizes).toHaveLength(2)
    expect(result.sizes[1].size).toBe(addedSize)
  })

  it('rejects duplicate names case-insensitively before writing', async () => {
    scope.productSizesRepository.findManyByProductId.mockReset()
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([existingSize])

    await expect(
      useCase.execute({
        actor,
        productId: product.id,
        input: { name: ' small ', quantity: 1, price: 5 },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.productSizesRepository.add).not.toHaveBeenCalled()
  })

  it('rejects invalid input, non-Managers, foreign products and non-Portion products', async () => {
    await expect(
      useCase.execute({
        actor,
        productId: product.id,
        input: { name: ' ', quantity: 1.2345, price: -1 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(database.run).not.toHaveBeenCalled()

    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: product.id,
        input: { name: 'Large', quantity: 1, price: 5 },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor,
        productId: 'foreign-product',
        input: { name: 'Large', quantity: 1, price: 5 },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: 'resale-1',
        establishmentId,
        categories: [ProductCategory.Resale],
      }),
    )
    await expect(
      useCase.execute({
        actor,
        productId: 'resale-1',
        input: { name: 'Large', quantity: 1, price: 5 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
  })
})
