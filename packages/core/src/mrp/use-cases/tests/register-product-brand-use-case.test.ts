import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Brand } from '#mrp/domain/entities/brand.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductStockAlertStateEnteredEvent } from '#mrp/domain/events/product-stock-alert-state-entered-event.ts'
import { ProductStockAlertState } from '#mrp/domain/structures/product-stock-alert-state.ts'
import { StockAdjustmentType } from '#mrp/domain/structures/stock-adjustment-type.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductAccompanimentFaker } from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
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
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { RegisterProductBrandUseCase } from '#mrp/use-cases/register-product-brand-use-case.ts'

const actor = {
  id: 'u1',
  name: 'Manager',
  establishmentId: 'e1',
  profile: UserProfile.Manager,
}
const product: Product = {
  id: 'p1',
  establishmentId: 'e1',
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.ByBrand,
  status: ProductStatus.Active,
  idealStock: 10,
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

describe('Register Product Brand Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let datetime: MockProxy<DatetimeProvider>
  let useCase: RegisterProductBrandUseCase
  beforeEach(() => {
    database = mock()
    scope = mockDeep()
    datetime = mock()
    datetime.now.mockReturnValue(new Date('2026-01-01T00:00:00Z'))
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(product)
    scope.brandsRepository.findByName.mockResolvedValue(undefined)
    scope.brandsRepository.countByProductId.mockResolvedValue(0)
    scope.brandsRepository.add.mockResolvedValue(brand)
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue({
      productId: 'p1',
      brandId: 'b1',
      quantity: 0,
      situation: StockSituation.Normal,
    })
    scope.stockBalancesRepository.add.mockResolvedValue({
      productId: 'p1',
      brandId: 'b1',
      quantity: 3,
      situation: StockSituation.Normal,
    })
    scope.stockBalancesRepository.findManyByProductId.mockResolvedValue([])
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [ProductSalesConfigurationSourceFaker.fake({ product })],
    )
    useCase = new RegisterProductBrandUseCase(database, datetime)
  })

  it('registers first brand as main with initial balance and ledger row', async () => {
    scope.stockBalancesRepository.findManyByProductId
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          productId: 'p1',
          brandId: 'b1',
          quantity: 3,
          situation: StockSituation.Normal,
        },
      ])
    await useCase.execute({
      actor,
      productId: 'p1',
      input: { name: ' A ', packageQuantity: 2, packageValue: 10, initialQuantity: 3 },
    })
    expect(scope.brandsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'A', isPrimary: true }),
    )
    expect(scope.stockBalancesRepository.add).toHaveBeenCalledWith(
      { productId: 'p1', brandId: 'b1' },
      3,
    )
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 3,
        balanceAfter: 3,
        performedByName: 'Manager',
      }),
    )
    expect(scope.productsRepository.findByIdForUpdate).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.eventsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ProductSalesConfigurationChangedEvent._NAME,
        payload: expect.objectContaining({
          productId: 'p1',
          state: 'available',
        }),
      }),
    )
  })

  it('propagates alert persistence failures through the transaction boundary', async () => {
    scope.stockBalancesRepository.findManyByProductId
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          productId: 'p1',
          brandId: 'b1',
          quantity: 3,
          situation: StockSituation.Normal,
        },
      ])
    const error = new Error('event persistence failed')
    scope.eventsRepository.add.mockRejectedValue(error)

    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        input: { name: ' A ', packageQuantity: 2, packageValue: 10, initialQuantity: 3 },
      }),
    ).rejects.toBe(error)
    expect(scope.productsRepository.findByIdForUpdate).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledTimes(1)
    expect(database.run).toHaveBeenCalledTimes(1)
  })

  it('creates no ledger row for zero and rejects invalid or duplicate brand', async () => {
    await useCase.execute({
      actor,
      productId: 'p1',
      input: { name: 'A', packageQuantity: 2, packageValue: 0, initialQuantity: 0 },
    })
    expect(scope.stockTransactionsRepository.add).not.toHaveBeenCalled()
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        input: { name: '', packageQuantity: 0, packageValue: -1, initialQuantity: -1 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    scope.brandsRepository.findByName.mockResolvedValue(brand)
    await expect(
      useCase.execute({
        actor,
        productId: 'p1',
        input: { name: 'A', packageQuantity: 1, packageValue: 0, initialQuantity: 0 },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  const validInput = {
    name: 'A',
    packageQuantity: 2,
    packageValue: 10,
    initialQuantity: 0,
  }
  const run = (input: Partial<typeof validInput> & { unit?: ProductUnit } = {}) =>
    useCase.execute({ actor, productId: 'p1', input: { ...validInput, ...input } })

  it('only lets managers register brands', async () => {
    const attendant = { ...actor, profile: UserProfile.Operator }
    await expect(
      useCase.execute({ actor: attendant, productId: 'p1', input: validInput }),
    ).rejects.toThrow(new AuthorizationError('Somente gestores podem registrar marcas.'))
    expect(database.run).not.toHaveBeenCalled()
  })

  it.each([
    [
      'blank name',
      { name: '   ' },
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
      { packageValue: -0.01 },
      'O valor da embalagem não pode ser negativo.',
    ],
    [
      'non finite package value',
      { packageValue: Number.POSITIVE_INFINITY },
      'O valor da embalagem não pode ser negativo.',
    ],
    ['unknown unit', { unit: 'bogus' as ProductUnit }, 'A unidade da marca é inválida.'],
    [
      'negative initial quantity',
      { initialQuantity: -1 },
      'O estoque inicial não pode ser negativo.',
    ],
    [
      'non finite initial quantity',
      { initialQuantity: Number.NaN },
      'O estoque inicial não pode ser negativo.',
    ],
  ])('rejects %s before touching the database', async (_label, input, message) => {
    await expect(run(input)).rejects.toThrow(new BadRequestError(message))
    expect(database.run).not.toHaveBeenCalled()
  })

  it('accepts a name of exactly 120 characters and a valid explicit unit', async () => {
    const name = 'x'.repeat(120)
    await run({ name, unit: ProductUnit.Kilogram })
    expect(scope.brandsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ name, unit: ProductUnit.Kilogram }),
    )
  })

  it('hides a missing product and falls back to the plain lookup when no lock row is returned', async () => {
    scope.productsRepository.findById.mockResolvedValue(undefined)
    await expect(run()).rejects.toThrow(new NotFoundError('Produto não encontrado.'))
    expect(scope.productsRepository.findByIdForUpdate).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.productsRepository.findById).toHaveBeenCalledWith('e1', 'p1')
    expect(scope.brandsRepository.add).not.toHaveBeenCalled()
  })

  it('prefers the row-locked product over the plain lookup', async () => {
    scope.productsRepository.findByIdForUpdate.mockResolvedValue({
      ...product,
      name: 'Locked milk',
    })
    await run({ initialQuantity: 3 })
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ productName: 'Locked milk' }),
    )
  })

  it('rejects products that do not control stock by brand', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.Single,
    })
    await expect(run()).rejects.toThrow(
      new BadRequestError('Este produto não utiliza estoque por marca.'),
    )
    expect(scope.brandsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects a duplicate trimmed name with the conflict message', async () => {
    scope.brandsRepository.findByName.mockResolvedValue(brand)
    await expect(run({ name: ' A ' })).rejects.toThrow(
      new ConflictError('Já existe uma marca com esse nome para o produto.'),
    )
    expect(scope.brandsRepository.findByName).toHaveBeenCalledWith('p1', 'A')
    expect(scope.brandsRepository.add).not.toHaveBeenCalled()
  })

  it('registers a later brand as non primary using the product unit by default', async () => {
    scope.brandsRepository.countByProductId.mockResolvedValue(1)
    await run({ packageQuantity: 4, packageValue: 12 })
    expect(scope.brandsRepository.countByProductId).toHaveBeenCalledWith('p1')
    expect(scope.brandsRepository.add).toHaveBeenCalledWith({
      productId: 'p1',
      name: 'A',
      unit: ProductUnit.Liter,
      packageQuantity: 4,
      packagePrice: 12,
      isPrimary: false,
    })
    expect(scope.stockBalancesRepository.initialize).toHaveBeenCalledWith('p1', 'b1')
  })

  it('returns the zero balance and unit price when there is no initial stock', async () => {
    const result = await run()
    expect(result).toEqual({ brand, stockQuantity: 0, unitPrice: 5 })
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
  })

  it('returns zero stock when the balance cannot be read back', async () => {
    scope.stockBalancesRepository.findByProductAndBrand.mockResolvedValue(undefined)
    await expect(run()).resolves.toMatchObject({ stockQuantity: 0 })
  })

  it('records the complete entry ledger row for the initial quantity', async () => {
    const result = await run({ initialQuantity: 3 })
    expect(result).toMatchObject({ stockQuantity: 3, unitPrice: 5 })
    expect(scope.stockTransactionsRepository.add).toHaveBeenCalledWith({
      establishmentId: 'e1',
      productId: 'p1',
      brandId: 'b1',
      productName: 'Milk',
      brandName: 'A',
      unit: ProductUnit.Liter,
      type: StockAdjustmentType.Entry,
      quantity: 3,
      balanceAfter: 3,
      performedBy: 'u1',
      performedByName: 'Manager',
      occurredAt: new Date('2026-01-01T00:00:00Z'),
    })
  })

  it('publishes a stock alert when the new stock stays below the ideal level', async () => {
    scope.stockBalancesRepository.findManyByProductId
      .mockResolvedValueOnce([
        {
          productId: 'p1',
          brandId: 'b0',
          quantity: 12,
          situation: StockSituation.Normal,
        },
      ])
      .mockResolvedValueOnce([
        { productId: 'p1', brandId: 'b0', quantity: 4, situation: StockSituation.Normal },
        { productId: 'p1', brandId: 'b1', quantity: 3, situation: StockSituation.Normal },
      ])
    await run({ initialQuantity: 3 })
    expect(scope.eventsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ProductStockAlertStateEnteredEvent._NAME,
        payload: expect.objectContaining({
          productId: 'p1',
          state: ProductStockAlertState.BelowIdeal,
          availableQuantity: 7,
          idealQuantity: 10,
        }),
      }),
    )
  })

  it('measures the name length after trimming surrounding spaces', async () => {
    const name = 'x'.repeat(120)
    await run({ name: ` ${name} ` })
    expect(scope.brandsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ name }),
    )
  })

  it('publishes the stock alert before the complete By-brand sales configuration', async () => {
    const brandUpdatedAt = new Date('2030-01-01T00:00:00.000Z')
    scope.stockBalancesRepository.findManyByProductId
      .mockResolvedValueOnce([
        {
          productId: 'p1',
          brandId: 'b0',
          quantity: 12,
          situation: StockSituation.Normal,
        },
      ])
      .mockResolvedValueOnce([
        { productId: 'p1', brandId: 'b0', quantity: 4, situation: StockSituation.Normal },
        { productId: 'p1', brandId: 'b1', quantity: 3, situation: StockSituation.Normal },
      ])
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({
          product,
          brands: [{ ...brand, updatedAt: brandUpdatedAt }],
        }),
      ],
    )

    await run({ initialQuantity: 3 })

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', ['p1'])
    expect(scope.eventsRepository.add.mock.calls.map(([event]) => event)).toEqual([
      expect.objectContaining({ name: ProductStockAlertStateEnteredEvent._NAME }),
      new ProductSalesConfigurationChangedEvent({
        establishmentId: 'e1',
        productId: 'p1',
        state: 'available',
        configuration: {
          establishmentId: 'e1',
          productId: 'p1',
          name: 'Milk',
          categories: [ProductCategory.Ingredient],
          status: ProductStatus.Active,
          stockControl: ProductStockControl.ByBrand,
          sizes: [],
          resaleConfigurations: [],
          updatedAt: brandUpdatedAt,
        },
      }),
    ])
  })

  it('republishes every Portion that uses the product as an accompaniment', async () => {
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [
        ProductAccompanimentFaker.fake({
          establishmentId: 'e1',
          productId: 'portion-1',
          accompanimentProductId: 'p1',
        }),
      ],
    )

    await run()

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith('e1', ['p1', 'portion-1'])
  })
})
