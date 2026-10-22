import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { ListProductAccompanimentCandidatesUseCase } from '#mrp/use-cases/list-product-accompaniment-candidates-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const owner = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
})
const accompaniment = (id: string, name: string, overrides = {}) =>
  ProductFaker.fake({
    id,
    establishmentId,
    name,
    categories: [ProductCategory.Accompaniment],
    status: ProductStatus.Active,
    accompanimentPrice: 2,
    ...overrides,
  })

describe('List Product Accompaniment Candidates Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: ListProductAccompanimentCandidatesUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(owner)
    scope.productsRepository.findManyByCategory.mockResolvedValue([])
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([])
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      0,
    )
    scope.globalAccompanimentsRepository.findManyByEstablishmentId.mockResolvedValue([])
    useCase = new ListProductAccompanimentCandidatesUseCase(database)
  })

  it('returns only eligible absent products ordered by name with their facts', async () => {
    const eligible = accompaniment('eligible', 'Morango', {
      unit: ProductUnit.Kilogram,
      stockControl: ProductStockControl.ByBrand,
      accompanimentPrice: 2.5,
    })
    const unpriced = accompaniment('unpriced', 'banana', {
      accompanimentPrice: undefined,
    })
    const linkedElsewhere = accompaniment('linked-elsewhere', 'Calda')
    const globalRemovedHere = accompaniment('global-removed', 'Granola')
    const individualHere = accompaniment('individual-here', 'Amendoim')
    const globalHere = accompaniment('global-here', 'Leite em pó')
    const inactive = accompaniment('inactive', 'Cereja', {
      status: ProductStatus.Inactive,
    })
    const legacyPortion = accompaniment('legacy-portion', 'Doce de leite', {
      categories: [ProductCategory.Accompaniment, ProductCategory.Portion],
    })
    const foreign = accompaniment('foreign', 'Estrangeiro', {
      establishmentId: 'another-establishment',
    })
    const ownerAsAccompaniment = accompaniment(owner.id, 'Self')
    const sharedGlobal = GlobalAccompanimentFaker.fake({
      id: 'global-1',
      establishmentId,
      accompanimentProductId: globalRemovedHere.id,
      accompanimentTypeId: 'type-1',
      quantityPerPortion: 0.05,
      accompanimentPrice: 7.25,
    })
    const globalPresentHere = GlobalAccompanimentFaker.fake({
      id: 'global-2',
      establishmentId,
      accompanimentProductId: globalHere.id,
    })
    scope.productsRepository.findManyByCategory.mockResolvedValue([
      eligible,
      globalHere,
      foreign,
      unpriced,
      inactive,
      legacyPortion,
      individualHere,
      ownerAsAccompaniment,
      globalRemovedHere,
      linkedElsewhere,
    ])
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
      ProductAccompanimentFaker.fake({
        establishmentId,
        productId: owner.id,
        accompanimentProductId: individualHere.id,
      }),
      ProductAccompanimentFaker.fake({
        establishmentId,
        productId: owner.id,
        accompanimentProductId: globalHere.id,
        globalAccompanimentId: globalPresentHere.id,
      }),
    ])
    scope.globalAccompanimentsRepository.findManyByEstablishmentId.mockResolvedValue([
      globalPresentHere,
      sharedGlobal,
    ])
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockImplementation(
      async (_, productId) => (productId === linkedElsewhere.id ? 2 : 0),
    )

    const result = await useCase.execute({ actor, productId: owner.id })

    expect(result).toEqual([
      {
        productId: unpriced.id,
        name: unpriced.name,
        unit: unpriced.unit,
        stockControl: unpriced.stockControl,
        accompanimentPrice: null,
        isGlobal: false,
        hasPortionLinks: false,
      },
      {
        productId: linkedElsewhere.id,
        name: linkedElsewhere.name,
        unit: linkedElsewhere.unit,
        stockControl: linkedElsewhere.stockControl,
        accompanimentPrice: 2,
        isGlobal: false,
        hasPortionLinks: true,
      },
      {
        productId: globalRemovedHere.id,
        name: globalRemovedHere.name,
        unit: globalRemovedHere.unit,
        stockControl: globalRemovedHere.stockControl,
        accompanimentPrice: 7.25,
        isGlobal: true,
        hasPortionLinks: false,
        global: { accompanimentTypeId: 'type-1', quantityPerPortion: 0.05 },
      },
      {
        productId: eligible.id,
        name: eligible.name,
        unit: ProductUnit.Kilogram,
        stockControl: ProductStockControl.ByBrand,
        accompanimentPrice: 2.5,
        isGlobal: false,
        hasPortionLinks: false,
      },
    ])
    expect(scope.productsRepository.findManyByCategory).toHaveBeenCalledWith(
      establishmentId,
      ProductCategory.Accompaniment,
    )
    expect(
      scope.productAccompanimentsRepository.findManyByProductId,
    ).toHaveBeenCalledWith(establishmentId, owner.id)
    expect(
      scope.globalAccompanimentsRepository.findManyByEstablishmentId,
    ).toHaveBeenCalledWith(establishmentId)
    expect(
      scope.productAccompanimentsRepository.countByAccompanimentProductId,
    ).not.toHaveBeenCalledWith(establishmentId, globalRemovedHere.id)
  })

  it('reports null for a global candidate whose global has no price, ignoring the default', async () => {
    const globalProduct = accompaniment('global-product', 'Granola', {
      accompanimentPrice: 2,
    })
    scope.productsRepository.findManyByCategory.mockResolvedValue([globalProduct])
    scope.globalAccompanimentsRepository.findManyByEstablishmentId.mockResolvedValue([
      GlobalAccompanimentFaker.fake({
        establishmentId,
        accompanimentProductId: globalProduct.id,
        accompanimentPrice: undefined,
      }),
    ])

    const result = await useCase.execute({ actor, productId: owner.id })

    expect(result).toMatchObject([{ isGlobal: true, accompanimentPrice: null }])
  })

  it('orders products with the same name by id', async () => {
    scope.productsRepository.findManyByCategory.mockResolvedValue([
      accompaniment('b-id', 'Mel'),
      accompaniment('a-id', 'Mel'),
    ])

    const result = await useCase.execute({ actor, productId: owner.id })

    expect(result.map((candidate) => candidate.productId)).toEqual(['a-id', 'b-id'])
  })

  it('rejects operators before reading anything', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: owner.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    expect(scope.productsRepository.findById).not.toHaveBeenCalled()
    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    { description: 'a missing owner', product: undefined, error: NotFoundError },
    {
      description: 'an owner from another establishment',
      product: { ...owner, establishmentId: 'another-establishment' },
      error: NotFoundError,
    },
    {
      description: 'an owner that is not a Portion',
      product: { ...owner, categories: [ProductCategory.Ingredient] },
      error: BadRequestError,
    },
  ])('rejects $description without listing candidates', async ({ product, error }) => {
    scope.productsRepository.findById.mockResolvedValue(product)

    await expect(useCase.execute({ actor, productId: owner.id })).rejects.toBeInstanceOf(
      error,
    )

    expect(scope.productsRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      owner.id,
    )
    expect(scope.productsRepository.findManyByCategory).not.toHaveBeenCalled()
  })
})
