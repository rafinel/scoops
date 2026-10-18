import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
  StockSituation,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { UpdateProductBrandUseCase } from '#mrp/use-cases/update-product-brand-use-case.ts'

const actor = { id: 'u1', establishmentId: 'e1', profile: UserProfile.Manager }
const product: Product = {
  id: 'p1',
  establishmentId: 'e1',
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.ByBrand,
  status: ProductStatus.Active,
  createdAt: new Date(),
  updatedAt: new Date(),
}
const brand: Brand = {
  id: 'b1',
  productId: 'p1',
  name: 'A',
  packageQuantity: 2,
  packagePrice: 10,
  isPrimary: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Update Product Brand Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: UpdateProductBrandUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findById.mockResolvedValue(brand)
    scope.brandsRepository.findByName.mockResolvedValue(undefined)
    scope.brandsRepository.replace.mockResolvedValue({
      ...brand,
      name: 'B',
      packageQuantity: 4,
      packagePrice: 12,
    })
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue({
      productId: 'p1',
      brandId: 'b1',
      quantity: 7,
      situation: StockSituation.Normal,
    })
    useCase = new UpdateProductBrandUseCase(database)
  })
  it('updates configuration without changing stock', async () => {
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        brandId: 'b1',
        input: { name: ' B ', packageQuantity: 4, packageValue: 12 },
      }),
    ).resolves.toMatchObject({ stockQuantity: 7, unitPrice: 3 })
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
  })
  it('rejects duplicates and foreign brands', async () => {
    scope.brandsRepository.findByName.mockResolvedValue({ ...brand, id: 'b2' })
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        brandId: 'b1',
        input: { name: 'A', packageQuantity: 1, packageValue: 0 },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    scope.brandsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        brandId: 'foreign',
        input: { name: 'A', packageQuantity: 1, packageValue: 0 },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  const validInput = { name: 'B', packageQuantity: 4, packageValue: 12 }
  const run = (input: Partial<typeof validInput> & { unit?: ProductUnit } = {}) =>
    useCase.execute({
      actor,
      productId: 'p1',
      brandId: 'b1',
      input: { ...validInput, ...input },
    })

  it('only lets managers update brands', async () => {
    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: 'p1',
        brandId: 'b1',
        input: validInput,
      }),
    ).rejects.toThrow(new AuthorizationError('Somente gestores podem alterar marcas.'))
    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    [
      'blank name',
      { name: '  ' },
      'O nome da marca deve possuir entre 1 e 120 caracteres.',
    ],
    [
      'name over 120 characters',
      { name: 'x'.repeat(121) },
      'O nome da marca deve possuir entre 1 e 120 caracteres.',
    ],
    [
      'zero package quantity',
      { packageQuantity: 0 },
      'A quantidade por embalagem deve ser maior que zero.',
    ],
    [
      'non finite package quantity',
      { packageQuantity: Number.NaN },
      'A quantidade por embalagem deve ser maior que zero.',
    ],
    [
      'negative package value',
      { packageValue: -1 },
      'O valor da embalagem não pode ser negativo.',
    ],
    [
      'non finite package value',
      { packageValue: Number.NaN },
      'O valor da embalagem não pode ser negativo.',
    ],
    ['unknown unit', { unit: 'bogus' as ProductUnit }, 'A unidade da marca é inválida.'],
  ])('rejects %s before touching the database', async (_label, input, message) => {
    await expect(run(input)).rejects.toThrow(new BadRequestError(message))
    expect(database.run).not.toHaveBeenCalled()
  })

  it('accepts a 120 character name, zero value and an explicit unit', async () => {
    const name = 'x'.repeat(120)
    await run({ name, packageValue: 0, unit: ProductUnit.Kilogram })
    expect(scope.brandsRepository.replace).toHaveBeenCalledWith('p1', 'b1', {
      name,
      unit: ProductUnit.Kilogram,
      packageQuantity: 4,
      packagePrice: 0,
    })
  })

  it('replaces the brand keeping its unit when none is informed', async () => {
    scope.brandsRepository.findById.mockResolvedValue({
      ...brand,
      unit: ProductUnit.Kilogram,
    })
    await run({ name: ' B ' })
    expect(scope.productsRepository.findById).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.brandsRepository.findById).toHaveBeenCalledWith('p1', 'b1')
    expect(scope.brandsRepository.findByName).toHaveBeenCalledWith('p1', 'B')
    expect(scope.brandsRepository.replace).toHaveBeenCalledWith('p1', 'b1', {
      name: 'B',
      unit: ProductUnit.Kilogram,
      packageQuantity: 4,
      packagePrice: 12,
    })
    expect(scope.stockBalancesRepository.findByProductAndBrand).toHaveBeenCalledWith(
      'p1',
      'b1',
    )
  })

  it('returns the saved brand, stock and unit price', async () => {
    const result = await run()
    expect(result).toEqual({
      brand: { ...brand, name: 'B', packageQuantity: 4, packagePrice: 12 },
      stockQuantity: 7,
      unitPrice: 3,
    })
  })

  it('reports zero stock when the brand has no balance', async () => {
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue(undefined)
    await expect(run()).resolves.toMatchObject({ stockQuantity: 0 })
  })

  it('allows keeping the brand own name', async () => {
    scope.brandsRepository.findByName.mockResolvedValue(brand)
    await expect(run({ name: 'A' })).resolves.toBeDefined()
    expect(scope.brandsRepository.replace).toHaveBeenCalled()
  })

  it('rejects a duplicate name with the conflict message and saves nothing', async () => {
    scope.brandsRepository.findByName.mockResolvedValue({ ...brand, id: 'b2' })
    await expect(run()).rejects.toThrow(
      new ConflictError('Já existe uma marca com esse nome para o produto.'),
    )
    expect(scope.brandsRepository.replace).not.toHaveBeenCalled()
  })

  it('hides missing products and brands with their own messages', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(run()).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findById.mockResolvedValue(undefined)
    await expect(run()).rejects.toThrow(new NotFoundError('Marca não encontrada.'))
    expect(scope.brandsRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects products that do not control stock by brand', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.Single,
    })
    await expect(run()).rejects.toThrow(
      new BadRequestError('Este produto não utiliza estoque por marca.'),
    )
    expect(scope.brandsRepository.findById).not.toHaveBeenCalled()
    expect(scope.brandsRepository.replace).not.toHaveBeenCalled()
  })

  it('publishes the refreshed sales configuration of the product', async () => {
    await run()
    expect(scope.eventsRepository.add).toHaveBeenCalledTimes(1)
    expect(scope.eventsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ProductSalesConfigurationChangedEvent._NAME,
        payload: expect.objectContaining({
          establishmentId: 'e1',
          productId: 'p1',
          state: 'available',
        }),
      }),
    )
  })

  it('measures the name length after trimming surrounding spaces', async () => {
    const name = 'x'.repeat(120)
    await run({ name: ` ${name} ` })
    expect(scope.brandsRepository.replace).toHaveBeenCalledWith(
      'p1',
      'b1',
      expect.objectContaining({ name }),
    )
  })
})
