import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory, ProductStatus } from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { ListAccompanimentPortionCandidatesUseCase } from '#mrp/use-cases/list-accompaniment-portion-candidates-use-case.ts'

const establishmentId = 'establishment-1'
const manager = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const accompaniment = ProductFaker.fake({
  id: 'accompaniment-1',
  establishmentId,
  categories: [ProductCategory.Accompaniment],
})

function portion(id: string, name: string, overrides = {}) {
  return ProductFaker.fake({
    id,
    establishmentId,
    name,
    categories: [ProductCategory.Portion],
    ...overrides,
  })
}

describe('List Accompaniment Portion Candidates Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: ListAccompanimentPortionCandidatesUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(accompaniment)
    scope.productsRepository.findManyByCategory.mockResolvedValue([])
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    useCase = new ListAccompanimentPortionCandidatesUseCase(database)
  })

  it('returns every Portion without a row for the Accompaniment, ordered by name', async () => {
    const zebra = portion('p-zebra', 'zebra')
    const acai = portion('p-acai', 'Açaí', { status: ProductStatus.Inactive })
    const linked = portion('p-linked', 'Banana')
    const bowl = portion('p-bowl', ' bowl ')
    scope.productsRepository.findManyByCategory.mockResolvedValue([
      zebra,
      linked,
      bowl,
      acai,
    ])
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId,
          productId: linked.id,
          accompanimentProductId: accompaniment.id,
        }),
      ],
    )

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result).toEqual([
      { productId: acai.id, name: 'Açaí', status: ProductStatus.Inactive },
      { productId: bowl.id, name: ' bowl ', status: ProductStatus.Active },
      { productId: zebra.id, name: 'zebra', status: ProductStatus.Active },
    ])
    expect(scope.productsRepository.findManyByCategory).toHaveBeenCalledWith(
      establishmentId,
      ProductCategory.Portion,
    )
    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).toHaveBeenCalledWith(establishmentId, accompaniment.id)
  })

  it('orders Portions with the same name by id and ignores case', async () => {
    const second = portion('p-2', 'Cup')
    const first = portion('p-1', 'cup')
    scope.productsRepository.findManyByCategory.mockResolvedValue([second, first])

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.map((candidate) => candidate.productId)).toEqual(['p-1', 'p-2'])
  })

  it('returns nothing when every Portion already has a row', async () => {
    const linked = portion('p-linked', 'Banana')
    scope.productsRepository.findManyByCategory.mockResolvedValue([linked])
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [ProductAccompanimentFaker.fake({ productId: linked.id })],
    )

    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).resolves.toEqual([])
  })

  it('ignores Portions of another establishment', async () => {
    scope.productsRepository.findManyByCategory.mockResolvedValue([
      portion('p-own', 'Own'),
      portion('p-foreign', 'Foreign', { establishmentId: 'another-establishment' }),
    ])

    const result = await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(result.map((candidate) => candidate.productId)).toEqual(['p-own'])
  })

  it('rejects Operators before opening a transaction', async () => {
    await expect(
      useCase.execute({
        actor: { ...manager, profile: UserProfile.Operator },
        productId: accompaniment.id,
      }),
    ).rejects.toThrow(
      new AuthorizationError(
        'Somente gestores podem consultar porções disponíveis para vínculo.',
      ),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    { name: 'missing', product: undefined },
    {
      name: 'foreign',
      product: { ...accompaniment, establishmentId: 'another-establishment' },
    },
  ])('rejects a $name route product', async ({ product }) => {
    scope.productsRepository.findById.mockResolvedValue(product)

    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
    expect(scope.productsRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      accompaniment.id,
    )
    expect(scope.productsRepository.findManyByCategory).not.toHaveBeenCalled()
  })

  it.each([
    { name: 'lacks the Accompaniment category', categories: [ProductCategory.Portion] },
    {
      name: 'is a legacy Portion and Accompaniment',
      categories: [ProductCategory.Portion, ProductCategory.Accompaniment],
    },
  ])('rejects a product that $name', async ({ categories }) => {
    scope.productsRepository.findById.mockResolvedValue({ ...accompaniment, categories })

    await expect(
      useCase.execute({ actor: manager, productId: accompaniment.id }),
    ).rejects.toThrow(
      new BadRequestError('O produto não é um acompanhamento elegível para porções.'),
    )
    expect(scope.productsRepository.findManyByCategory).not.toHaveBeenCalled()
  })

  it('never writes', async () => {
    await useCase.execute({ actor: manager, productId: accompaniment.id })

    expect(scope.productAccompanimentsRepository.addMany).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })
})
