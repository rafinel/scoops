import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
} from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { LinkProductAccompanimentUseCase } from '#mrp/use-cases/link-product-accompaniment-use-case.ts'

const establishmentId = 'establishment-1'
const owner = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
})
const target = ProductFaker.fake({
  id: 'accompaniment-1',
  establishmentId,
  categories: [ProductCategory.Accompaniment],
  currentUnitCost: undefined,
})
const type = AccompanimentTypeFaker.fake({
  id: 'type-1',
  establishmentId,
  name: 'Sauces',
})
const link = ProductAccompanimentFaker.fake({
  id: 'link-1',
  establishmentId,
  productId: owner.id,
  accompanimentProductId: target.id,
  accompanimentTypeId: type.id,
  quantityPerPortion: 1.25,
})

describe('Link Product Accompaniment Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: LinkProductAccompanimentUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : target,
    )
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.productAccompanimentsRepository.findByProductAndAccompaniment.mockResolvedValue(
      undefined,
    )
    scope.productAccompanimentsRepository.add.mockResolvedValue(link)
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    useCase = new LinkProductAccompanimentUseCase(database)
  })

  it('inserts one tenant-qualified link and returns its current projection', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        input: {
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1.25,
        },
      }),
    ).resolves.toMatchObject({
      id: link.id,
      accompanimentProductId: target.id,
      quantityPerPortion: 1.25,
    })
    expect(scope.productAccompanimentsRepository.add).toHaveBeenCalledWith({
      establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1.25,
    })
  })

  it('rejects invalid quantity, duplicate, inactive/wrong-category, foreign type and non-manager branches before writing', async () => {
    const request = {
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      input: {
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.2345,
      },
    }
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    scope.productAccompanimentsRepository.findByProductAndAccompaniment.mockResolvedValue(
      link,
    )
    await expect(
      useCase.execute({ ...request, input: { ...request.input, quantityPerPortion: 1 } }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    scope.productAccompanimentsRepository.findByProductAndAccompaniment.mockResolvedValue(
      undefined,
    )
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : { ...target, status: ProductStatus.Inactive },
    )
    await expect(
      useCase.execute({ ...request, input: { ...request.input, quantityPerPortion: 1 } }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : { ...target, categories: [ProductCategory.Ingredient] },
    )
    await expect(
      useCase.execute({ ...request, input: { ...request.input, quantityPerPortion: 1 } }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : target,
    )
    scope.accompanimentTypesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ ...request, input: { ...request.input, quantityPerPortion: 1 } }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : { ...target, establishmentId: 'other-establishment' },
    )
    await expect(
      useCase.execute({ ...request, input: { ...request.input, quantityPerPortion: 1 } }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    scope.productsRepository.findById.mockImplementation(async () => owner)
    await expect(
      useCase.execute({
        ...request,
        input: {
          ...request.input,
          accompanimentProductId: owner.id,
          quantityPerPortion: 1,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    const byBrandTarget = { ...target, stockControl: ProductStockControl.ByBrand }
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : byBrandTarget,
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([])
    await expect(
      useCase.execute({ ...request, input: { ...request.input, quantityPerPortion: 1 } }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    await expect(
      useCase.execute({
        ...request,
        actor: { ...request.actor, profile: UserProfile.Operator },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
