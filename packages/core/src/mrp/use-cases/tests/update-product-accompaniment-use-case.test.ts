import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/index.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { UpdateProductAccompanimentUseCase } from '#mrp/use-cases/update-product-accompaniment-use-case.ts'

const establishmentId = 'establishment-1'
const owner = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
})
const target = ProductFaker.fake({
  id: 'target-1',
  establishmentId,
  categories: [ProductCategory.Accompaniment],
  name: 'Meringue',
})
const link = ProductAccompanimentFaker.fake({
  id: 'link-1',
  establishmentId,
  productId: owner.id,
  accompanimentProductId: target.id,
  accompanimentTypeId: 'type-old',
  quantityPerPortion: 1,
})
const type = AccompanimentTypeFaker.fake({
  id: 'type-new',
  establishmentId,
  name: 'Toppings',
})
const updated = { ...link, accompanimentTypeId: type.id, quantityPerPortion: 0.75 }

describe('Update Product Accompaniment Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseScope>
  let useCase: UpdateProductAccompanimentUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseScope>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : target,
    )
    scope.productAccompanimentsRepository.findById.mockResolvedValue(link)
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.productAccompanimentsRepository.replace.mockResolvedValue(updated)
    useCase = new UpdateProductAccompanimentUseCase(database)
  })

  it('changes only type and quantity while retaining the accompaniment target', async () => {
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        linkId: link.id,
        input: { accompanimentTypeId: type.id, quantityPerPortion: 0.75 },
      }),
    ).resolves.toMatchObject({
      accompanimentProductId: target.id,
      quantityPerPortion: 0.75,
    })
    expect(scope.productAccompanimentsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      owner.id,
      link.id,
      {
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.75,
      },
    )
  })

  it('rejects invalid quantity, missing/foreign link or type, and operators without partial writes', async () => {
    const request = {
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      linkId: link.id,
      input: { accompanimentTypeId: type.id, quantityPerPortion: 1.2345 },
    }
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
    scope.productAccompanimentsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ ...request, input: { ...request.input, quantityPerPortion: 1 } }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
    scope.productAccompanimentsRepository.findById.mockResolvedValue(link)
    scope.accompanimentTypesRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({ ...request, input: { ...request.input, quantityPerPortion: 1 } }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
    await expect(
      useCase.execute({
        ...request,
        actor: { ...request.actor, profile: UserProfile.Operator },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
