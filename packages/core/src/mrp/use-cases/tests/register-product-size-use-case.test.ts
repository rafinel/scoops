import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductFaker, ProductSizeFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductCategory } from '#mrp/domain/structures/index.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
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
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: RegisterProductSizeUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
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
  const register = (
    input: { name: string; quantity: number; price: number },
    overrides: Partial<ProductActor> = {},
  ) =>
    useCase.execute({ actor: { ...actor, ...overrides }, productId: product.id, input })

  it('rejects non-Managers with the manager-only message before opening a transaction', async () => {
    const promise = register(
      { name: 'Large', quantity: 1, price: 5 },
      { profile: UserProfile.Operator },
    )

    await expect(promise).rejects.toThrow(
      new AuthorizationError('Somente gestores podem adicionar tamanhos.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    ['empty', ''],
    ['blank', '   '],
    ['over 120 characters', 'a'.repeat(121)],
    ['over 120 characters after trimming only outer spaces', ` ${'a'.repeat(121)} `],
  ])('rejects a %s name with the name message', async (_label, name) => {
    await expect(register({ name, quantity: 1, price: 5 })).rejects.toThrow(
      new BadRequestError('O nome do tamanho deve possuir entre 1 e 120 caracteres.'),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('accepts a name with exactly 120 characters', async () => {
    const name = 'a'.repeat(120)

    await register({ name, quantity: 1, price: 5 })

    expect(scope.productSizesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ name }),
    )
  })

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['NaN', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
    ['with four decimal places', 1.0001],
  ])('rejects a %s quantity with the quantity message', async (_label, quantity) => {
    await expect(register({ name: 'Large', quantity, price: 5 })).rejects.toThrow(
      new BadRequestError(
        'A quantidade deve ser positiva e possuir até três casas decimais.',
      ),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    ['negative', -0.01],
    ['NaN', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
    ['with three decimal places', 1.005],
  ])('rejects a %s price with the price message', async (_label, price) => {
    await expect(register({ name: 'Large', quantity: 1, price })).rejects.toThrow(
      new BadRequestError(
        'O preço deve ser não negativo e possuir até duas casas decimais.',
      ),
    )
    expect(database.run).not.toHaveBeenCalled()
  })

  it('accepts the smallest positive quantity with three decimals and a zero price', async () => {
    await register({ name: 'Large', quantity: 0.001, price: 0 })

    expect(scope.productSizesRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 0.001, price: 0 }),
    )
  })

  it('looks the product and its sizes up scoped to the actor establishment', async () => {
    await register({ name: 'Large', quantity: 1, price: 5 })

    expect(scope.productsRepository.findById).toHaveBeenCalledWith(
      establishmentId,
      product.id,
    )
    expect(scope.productSizesRepository.findManyByProductId).toHaveBeenCalledWith(
      establishmentId,
      product.id,
    )
  })

  it('reports a missing product with the not-found message', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)

    await expect(register({ name: 'Large', quantity: 1, price: 5 })).rejects.toThrow(
      new NotFoundError('Produto não encontrado.'),
    )
    expect(scope.productSizesRepository.add).not.toHaveBeenCalled()
  })

  it('reports a product from another establishment as not found', async () => {
    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: product.id,
        establishmentId: 'establishment-2',
        categories: [ProductCategory.Portion],
      }),
    )

    await expect(register({ name: 'Large', quantity: 1, price: 5 })).rejects.toThrow(
      new NotFoundError('Produto não encontrado.'),
    )
    expect(scope.productSizesRepository.add).not.toHaveBeenCalled()
  })

  it('rejects products that are not portions', async () => {
    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: product.id,
        establishmentId,
        categories: [ProductCategory.Manufacturable],
      }),
    )

    await expect(register({ name: 'Large', quantity: 1, price: 5 })).rejects.toThrow(
      new BadRequestError('O produto não é uma porção.'),
    )
    expect(scope.productSizesRepository.add).not.toHaveBeenCalled()
  })

  it('rejects products that are both portion and resale', async () => {
    scope.productsRepository.findById.mockResolvedValue(
      ProductFaker.fake({
        id: product.id,
        establishmentId,
        categories: [ProductCategory.Portion, ProductCategory.Resale],
      }),
    )

    await expect(register({ name: 'Large', quantity: 1, price: 5 })).rejects.toThrow(
      new BadRequestError('Porção e Revenda não podem ser usadas juntas.'),
    )
    expect(scope.productSizesRepository.add).not.toHaveBeenCalled()
  })

  it('reports duplicates with the conflict message, comparing the trimmed lower-cased name', async () => {
    scope.productSizesRepository.findManyByProductId.mockReset()
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([
      ProductSizeFaker.fake({ ...existingSize, name: '  Small  ' }),
    ])

    await expect(register({ name: ' SMALL ', quantity: 1, price: 5 })).rejects.toThrow(
      new ConflictError('Já existe um tamanho com esse nome para o produto.'),
    )
  })

  it('allows a different name even when other sizes exist', async () => {
    await register({ name: 'Medium', quantity: 1, price: 5 })

    expect(scope.productSizesRepository.add).toHaveBeenCalledTimes(1)
  })
})
