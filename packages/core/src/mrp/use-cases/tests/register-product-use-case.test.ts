import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductCreatedEvent } from '#mrp/domain/events/product-created-event.ts'
import { ProductStockAlertStateEnteredEvent } from '#mrp/domain/events/product-stock-alert-state-entered-event.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
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
import type { BrandsRepository } from '#mrp/interfaces/brands-repository.ts'
import type { GlobalAccompanimentsRepository } from '#mrp/interfaces/global-accompaniments-repository.ts'
import type { ProductAccompanimentsRepository } from '#mrp/interfaces/product-accompaniments-repository.ts'
import type { ProductSizesRepository } from '#mrp/interfaces/product-sizes-repository.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { ResaleConfigurationsRepository } from '#mrp/interfaces/resale-configurations-repository.ts'
import {
  GlobalAccompanimentFaker,
  ResaleConfigurationFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import type { StockBalancesRepository } from '#mrp/interfaces/stock-balances-repository.ts'
import type { StockTransactionsRepository } from '#mrp/interfaces/stock-transactions-repository.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
} from '#shared/domain/errors/index.ts'
import { RegisterProductUseCase } from '#mrp/use-cases/register-product-use-case.ts'

const product: Product = {
  id: 'product-1',
  establishmentId: 'establishment-1',
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.Single,
  status: ProductStatus.Active,
  allowNegativeStock: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const validSingleStockRequest: Parameters<RegisterProductUseCase['execute']>[0] = {
  actor: {
    id: 'manager-1',
    name: 'Manager',
    establishmentId: 'establishment-1',
    profile: UserProfile.Manager,
  },
  name: 'Milk',
  unit: ProductUnit.Liter,
  categories: [ProductCategory.Ingredient],
  stockControl: ProductStockControl.Single,
  idealStock: 0,
}

describe('Register Product Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let eventsRepository: MockProxy<EventsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let scope: MockProxy<MrpDatabaseRepositories>
  let brandsRepository: MockProxy<BrandsRepository>
  let productsRepository: MockProxy<ProductsRepository>
  let stockBalancesRepository: MockProxy<StockBalancesRepository>
  let stockTransactionsRepository: MockProxy<StockTransactionsRepository>
  let productAccompanimentsRepository: MockProxy<ProductAccompanimentsRepository>
  let globalAccompanimentsRepository: MockProxy<GlobalAccompanimentsRepository>
  let resaleConfigurationsRepository: MockProxy<ResaleConfigurationsRepository>
  let productSizesRepository: MockProxy<ProductSizesRepository>
  let useCase: RegisterProductUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    eventsRepository = mock<EventsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(new Date('2026-01-01T00:00:00.000Z'))
    brandsRepository = mock<BrandsRepository>()
    productsRepository = mock<ProductsRepository>()
    stockBalancesRepository = mock<StockBalancesRepository>()
    stockTransactionsRepository = mock<StockTransactionsRepository>()
    productAccompanimentsRepository = mock<ProductAccompanimentsRepository>()
    globalAccompanimentsRepository = mock<GlobalAccompanimentsRepository>()
    globalAccompanimentsRepository.findManyByEstablishmentId.mockResolvedValue([])
    resaleConfigurationsRepository = mock<ResaleConfigurationsRepository>()
    resaleConfigurationsRepository.add.mockResolvedValue(ResaleConfigurationFaker.fake())
    productSizesRepository = mock<ProductSizesRepository>()
    scope = {
      brandsRepository,
      productsRepository,
      stockBalancesRepository,
      stockTransactionsRepository,
      productAccompanimentsRepository,
      globalAccompanimentsRepository,
      resaleConfigurationsRepository,
      productSizesRepository,
      eventsRepository,
    } as unknown as MockProxy<MrpDatabaseRepositories>
    productsRepository.findByName.mockResolvedValue(undefined)
    productsRepository.add.mockResolvedValue(product)
    database.run.mockImplementation(async (operation) => operation(scope))
    useCase = new RegisterProductUseCase(database, datetimeProvider)
  })

  it('creates an active single-stock product and records the event in the transaction', async () => {
    const order: string[] = []
    productsRepository.add.mockImplementation(async (input) => {
      order.push('product')
      return { ...product, ...input }
    })
    stockBalancesRepository.initialize.mockImplementation(async () => {
      order.push('stock')
    })
    eventsRepository.add.mockImplementation(async (event) => {
      order.push('event')
      expect(
        event instanceof ProductCreatedEvent ||
          event instanceof ProductStockAlertStateEnteredEvent,
      ).toBe(true)
    })

    const result = await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: '  Milk  ',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      allowNegativeStock: false,
      idealStock: 10,
    })

    expect(result.name).toBe('Milk')
    expect(productsRepository.add).toHaveBeenCalledWith({
      establishmentId: 'establishment-1',
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      status: ProductStatus.Active,
      allowNegativeStock: false,
      idealStock: 10,
    })
    expect(productsRepository.findByName).toHaveBeenCalledWith('establishment-1', 'Milk')
    expect(order).toEqual(['product', 'stock', 'event', 'event'])
    expect(eventsRepository.add).toHaveBeenNthCalledWith(
      1,
      expect.any(ProductStockAlertStateEnteredEvent),
    )
    expect(eventsRepository.add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: ProductCreatedEvent._NAME,
        payload: expect.objectContaining({
          productId: product.id,
          establishmentId: 'establishment-1',
          createdAt: product.createdAt,
        }),
      }),
    )
  })

  describe('global accompaniments', () => {
    const portionRequest = {
      ...validSingleStockRequest,
      name: 'Açaí',
      categories: [ProductCategory.Portion],
    }
    const granola = GlobalAccompanimentFaker.fake({
      id: 'global-1',
      establishmentId: 'establishment-1',
      accompanimentProductId: 'granola',
      accompanimentTypeId: 'type-1',
      quantityPerPortion: 0.05,
    })
    const banana = GlobalAccompanimentFaker.fake({
      id: 'global-2',
      establishmentId: 'establishment-1',
      accompanimentProductId: 'banana',
      accompanimentTypeId: 'type-2',
      quantityPerPortion: 2,
    })

    it('adds one row per global to a newly registered Portion in the same transaction', async () => {
      const portion = {
        ...product,
        id: 'portion-1',
        categories: [ProductCategory.Portion],
      }
      productsRepository.add.mockResolvedValue(portion)
      globalAccompanimentsRepository.findManyByEstablishmentId.mockResolvedValue([
        granola,
        banana,
      ])

      await expect(useCase.execute(portionRequest)).resolves.toBe(portion)

      expect(database.run).toHaveBeenCalledTimes(1)
      expect(
        globalAccompanimentsRepository.findManyByEstablishmentId,
      ).toHaveBeenCalledWith('establishment-1')
      expect(productAccompanimentsRepository.addMany).toHaveBeenCalledWith([
        {
          establishmentId: 'establishment-1',
          productId: portion.id,
          accompanimentProductId: 'granola',
          accompanimentTypeId: 'type-1',
          quantityPerPortion: 0.05,
          globalAccompanimentId: 'global-1',
        },
        {
          establishmentId: 'establishment-1',
          productId: portion.id,
          accompanimentProductId: 'banana',
          accompanimentTypeId: 'type-2',
          quantityPerPortion: 2,
          globalAccompanimentId: 'global-2',
        },
      ])
      expect(productsRepository.add.mock.invocationCallOrder[0]).toBeLessThan(
        productAccompanimentsRepository.addMany.mock.invocationCallOrder[0],
      )
    })

    it('does not publish the creation when materializing the global rows fails', async () => {
      productAccompanimentsRepository.addMany.mockRejectedValue(new Error('failed'))

      await expect(useCase.execute(portionRequest)).rejects.toThrow('failed')

      expect(eventsRepository.add).not.toHaveBeenCalled()
    })

    it('does not look for globals when the new product is not a Portion', async () => {
      globalAccompanimentsRepository.findManyByEstablishmentId.mockResolvedValue([
        granola,
      ])

      await useCase.execute(validSingleStockRequest)
      await useCase.execute({
        ...validSingleStockRequest,
        categories: [ProductCategory.Accompaniment],
      })

      expect(
        globalAccompanimentsRepository.findManyByEstablishmentId,
      ).not.toHaveBeenCalled()
      expect(productAccompanimentsRepository.addMany).not.toHaveBeenCalled()
    })
  })

  it('persists when a product allows negative stock', async () => {
    await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      allowNegativeStock: true,
      idealStock: 0,
    })

    expect(productsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ allowNegativeStock: true }),
    )
  })

  it('persists a valid single-stock ingredient current unit cost', async () => {
    await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.Single,
      idealStock: 0,
      currentUnitCost: 0,
    })

    expect(productsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ currentUnitCost: 0 }),
    )
  })

  describe('sale prices', () => {
    const resaleRequest = {
      ...validSingleStockRequest,
      name: 'Paçoca',
      categories: [ProductCategory.Resale],
      initialStock: 10,
    }
    const accompanimentRequest = {
      ...validSingleStockRequest,
      name: 'Granola',
      categories: [ProductCategory.Accompaniment],
    }
    const byBrand = {
      stockControl: ProductStockControl.ByBrand,
      brands: [
        {
          name: 'House',
          packageQuantity: 1,
          packageValue: 5,
          initialQuantity: 0,
          isPrimary: true,
        },
      ],
    }

    beforeEach(() => {
      stockBalancesRepository.add.mockResolvedValue({
        productId: product.id,
        quantity: 10,
        situation: 'normal',
      })
    })

    it('registers an available Single-stock Resale configuration at the typed price in the same transaction', async () => {
      await useCase.execute({ ...resaleRequest, resalePrice: 12.5 })

      expect(database.run).toHaveBeenCalledTimes(1)
      expect(resaleConfigurationsRepository.add).toHaveBeenCalledTimes(1)
      expect(resaleConfigurationsRepository.add).toHaveBeenCalledWith({
        establishmentId: 'establishment-1',
        productId: product.id,
        price: 12.5,
        isActive: true,
      })
      const savedConfiguration = resaleConfigurationsRepository.add.mock.calls[0]?.[0]
      expect(Object.hasOwn(savedConfiguration ?? {}, 'brandId')).toBe(false)
      expect(productsRepository.add.mock.calls[0]?.[0]).not.toHaveProperty(
        'accompanimentPrice',
      )
      expect(productsRepository.add.mock.invocationCallOrder[0]).toBeLessThan(
        resaleConfigurationsRepository.add.mock.invocationCallOrder[0] as number,
      )
    })

    it('treats a zero Resale price as a supplied price', async () => {
      await useCase.execute({ ...resaleRequest, resalePrice: 0 })

      expect(resaleConfigurationsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({ price: 0, isActive: true }),
      )
    })

    it.each([0, 2.9])(
      'saves the product-owned Accompaniment price %s',
      async (accompanimentPrice) => {
        await useCase.execute({ ...accompanimentRequest, accompanimentPrice })

        expect(productsRepository.add).toHaveBeenCalledWith(
          expect.objectContaining({ accompanimentPrice }),
        )
        expect(resaleConfigurationsRepository.add).not.toHaveBeenCalled()
      },
    )

    it('saves both prices independently for a Resale and Accompaniment product', async () => {
      await useCase.execute({
        ...resaleRequest,
        categories: [ProductCategory.Resale, ProductCategory.Accompaniment],
        resalePrice: 12,
        accompanimentPrice: 9,
      })

      expect(productsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({ accompanimentPrice: 9 }),
      )
      expect(resaleConfigurationsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({ price: 12 }),
      )
    })

    it('saves only the supplied price when a Resale and Accompaniment product has one', async () => {
      await useCase.execute({
        ...resaleRequest,
        categories: [ProductCategory.Resale, ProductCategory.Accompaniment],
        resalePrice: 12,
      })

      expect(resaleConfigurationsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({ price: 12 }),
      )
      expect(productsRepository.add.mock.calls[0]?.[0]).not.toHaveProperty(
        'accompanimentPrice',
      )
    })

    it('creates no Resale configuration and no Accompaniment price when none is supplied', async () => {
      await useCase.execute({
        ...resaleRequest,
        categories: [ProductCategory.Resale, ProductCategory.Accompaniment],
      })

      expect(resaleConfigurationsRepository.add).not.toHaveBeenCalled()
      expect(
        Object.hasOwn(
          productsRepository.add.mock.calls[0]?.[0] ?? {},
          'accompanimentPrice',
        ),
      ).toBe(false)
    })

    it('registers a By-brand Resale product normally when no price is supplied', async () => {
      productsRepository.add.mockResolvedValue({
        ...product,
        stockControl: ProductStockControl.ByBrand,
      })
      brandsRepository.add.mockResolvedValue({
        id: 'brand-1',
        productId: product.id,
        name: 'House',
        packageQuantity: 1,
        packagePrice: 5,
        isPrimary: true,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })

      await useCase.execute({
        ...validSingleStockRequest,
        categories: [ProductCategory.Resale],
        ...byBrand,
      })

      expect(resaleConfigurationsRepository.add).not.toHaveBeenCalled()
    })

    it('does not commit anything when the Resale configuration cannot be saved', async () => {
      resaleConfigurationsRepository.add.mockRejectedValue(new Error('failed'))

      await expect(
        useCase.execute({ ...resaleRequest, resalePrice: 12.5 }),
      ).rejects.toThrow('failed')

      expect(database.run).toHaveBeenCalledTimes(1)
      expect(stockBalancesRepository.initialize).not.toHaveBeenCalled()
      expect(eventsRepository.add).not.toHaveBeenCalled()
    })

    it('rejects a priced registration from a non-manager without starting a transaction', async () => {
      await expect(
        useCase.execute({
          ...resaleRequest,
          actor: { ...resaleRequest.actor, profile: UserProfile.Operator },
          resalePrice: 12.5,
        }),
      ).rejects.toBeInstanceOf(AuthorizationError)

      expect(database.run).not.toHaveBeenCalled()
      expect(resaleConfigurationsRepository.add).not.toHaveBeenCalled()
    })

    describe.each([
      {
        field: 'resalePrice' as const,
        eligibleCategory: ProductCategory.Resale,
        otherCategory: ProductCategory.Accompaniment,
        eligibilityMessage:
          'O preço de revenda é permitido apenas para produtos de revenda com estoque único.',
        invalidMessage:
          'O preço de revenda deve ser maior ou igual a zero e ter até duas casas decimais.',
      },
      {
        field: 'accompanimentPrice' as const,
        eligibleCategory: ProductCategory.Accompaniment,
        otherCategory: ProductCategory.Resale,
        eligibilityMessage:
          'O preço como acompanhamento é permitido apenas para acompanhamentos de estoque único.',
        invalidMessage:
          'O preço deve ser maior ou igual a zero e ter até duas casas decimais.',
      },
    ])(
      'the $field rules',
      ({
        field,
        eligibleCategory,
        otherCategory,
        eligibilityMessage,
        invalidMessage,
      }) => {
        it.each([
          ['negative', -0.01],
          ['with three decimal places', 1.234],
          ['at the numeric(18,2) limit', 10_000_000_000_000_000],
          ['not a number', Number.NaN],
          ['infinite', Number.POSITIVE_INFINITY],
        ])(
          'rejects a price that is %s before starting registration',
          async (_name, price) => {
            const rejection = expect(
              useCase.execute({
                ...validSingleStockRequest,
                categories: [eligibleCategory],
                [field]: price,
              }),
            ).rejects

            await rejection.toBeInstanceOf(BadRequestError)
            await rejection.toThrow(invalidMessage)
            expect(database.run).not.toHaveBeenCalled()
            expect(productsRepository.add).not.toHaveBeenCalled()
            expect(resaleConfigurationsRepository.add).not.toHaveBeenCalled()
            expect(eventsRepository.add).not.toHaveBeenCalled()
          },
        )

        it.each([
          ['a product without the matching category', { categories: [otherCategory] }],
          ['an Ingredient', { categories: [ProductCategory.Ingredient] }],
          ['a Portion', { categories: [ProductCategory.Portion] }],
          ['a By-brand product', { categories: [eligibleCategory], ...byBrand }],
        ])(
          'rejects a price for %s before starting registration',
          async (_name, overrides) => {
            const rejection = expect(
              useCase.execute({ ...validSingleStockRequest, ...overrides, [field]: 1 }),
            ).rejects

            await rejection.toBeInstanceOf(BadRequestError)
            await rejection.toThrow(eligibilityMessage)
            expect(database.run).not.toHaveBeenCalled()
            expect(productsRepository.add).not.toHaveBeenCalled()
            expect(resaleConfigurationsRepository.add).not.toHaveBeenCalled()
            expect(eventsRepository.add).not.toHaveBeenCalled()
          },
        )

        it('accepts a valid two-decimal price', async () => {
          await expect(
            useCase.execute({
              ...validSingleStockRequest,
              categories: [eligibleCategory],
              [field]: 1_234_567.89,
            }),
          ).resolves.toBeDefined()
        })
      },
    )
  })

  describe('sizes', () => {
    const portionRequest = {
      ...validSingleStockRequest,
      name: 'Açaí',
      categories: [ProductCategory.Portion],
      sizes: [
        { name: ' Pequeno ', quantity: 0.3, price: 9.9 },
        { name: 'Grande', quantity: 0.5, price: 14.5 },
      ],
    }
    const byBrand = {
      stockControl: ProductStockControl.ByBrand,
      brands: [
        {
          name: 'House',
          packageQuantity: 1,
          packageValue: 5,
          initialQuantity: 0,
          isPrimary: true,
        },
      ],
    }

    it('adds one active size per row, trimmed and in input order, in the same transaction', async () => {
      await useCase.execute(portionRequest)

      expect(database.run).toHaveBeenCalledTimes(1)
      expect(productSizesRepository.add).toHaveBeenCalledTimes(2)
      expect(productSizesRepository.add).toHaveBeenNthCalledWith(1, {
        establishmentId: 'establishment-1',
        productId: product.id,
        name: 'Pequeno',
        quantity: 0.3,
        price: 9.9,
        isActive: true,
      })
      expect(productSizesRepository.add).toHaveBeenNthCalledWith(2, {
        establishmentId: 'establishment-1',
        productId: product.id,
        name: 'Grande',
        quantity: 0.5,
        price: 14.5,
        isActive: true,
      })
    })

    it('adds the sizes of a By-brand Portion', async () => {
      brandsRepository.add.mockResolvedValue({ id: 'brand-1', name: 'House' } as never)
      stockBalancesRepository.add.mockResolvedValue({
        productId: product.id,
        quantity: 0,
        situation: 'normal',
      })
      await useCase.execute({ ...portionRequest, ...byBrand })

      expect(productSizesRepository.add).toHaveBeenCalledTimes(2)
    })

    it.each([
      ['no sizes key', {}],
      ['an empty sizes list', { sizes: [] }],
    ])('adds no size for a Portion with %s', async (_name, overrides) => {
      await useCase.execute({ ...portionRequest, sizes: undefined, ...overrides })

      expect(productSizesRepository.add).not.toHaveBeenCalled()
    })

    it('accepts an empty sizes list for a product that is not a Portion', async () => {
      await expect(
        useCase.execute({ ...validSingleStockRequest, sizes: [] }),
      ).resolves.toBeDefined()
      expect(productSizesRepository.add).not.toHaveBeenCalled()
    })

    it('rejects sizes for a product without the Portion category before starting registration', async () => {
      const rejection = expect(
        useCase.execute({
          ...validSingleStockRequest,
          sizes: [{ name: 'Pequeno', quantity: 1, price: 5 }],
        }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow('Tamanhos são permitidos apenas para porções.')
      expect(database.run).not.toHaveBeenCalled()
      expect(productSizesRepository.add).not.toHaveBeenCalled()
    })

    it.each([
      [
        'an empty name',
        { name: '  ', quantity: 1, price: 5 },
        'O nome do tamanho deve possuir entre 1 e 120 caracteres.',
      ],
      [
        'a name over 120 characters',
        { name: 'a'.repeat(121), quantity: 1, price: 5 },
        'O nome do tamanho deve possuir entre 1 e 120 caracteres.',
      ],
      [
        'a zero quantity',
        { name: 'A', quantity: 0, price: 5 },
        'A quantidade deve ser positiva e possuir até três casas decimais.',
      ],
      [
        'a quantity with four decimals',
        { name: 'A', quantity: 1.2345, price: 5 },
        'A quantidade deve ser positiva e possuir até três casas decimais.',
      ],
      [
        'a quantity at the numeric(18,3) limit',
        { name: 'A', quantity: 1_000_000_000_000_000, price: 5 },
        'A quantidade deve ser positiva e possuir até três casas decimais.',
      ],
      [
        'a negative price',
        { name: 'A', quantity: 1, price: -1 },
        'O preço deve ser não negativo e possuir até duas casas decimais.',
      ],
      [
        'a price with three decimals',
        { name: 'A', quantity: 1, price: 1.005 },
        'O preço deve ser não negativo e possuir até duas casas decimais.',
      ],
      [
        'a price at the numeric(18,2) limit',
        { name: 'A', quantity: 1, price: 10_000_000_000_000_000 },
        'O preço deve ser não negativo e possuir até duas casas decimais.',
      ],
    ])('rejects %s before starting registration', async (_name, invalidSize, message) => {
      const rejection = expect(
        useCase.execute({
          ...portionRequest,
          sizes: [{ name: 'Válido', quantity: 1, price: 5 }, invalidSize],
        }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow(message)
      expect(database.run).not.toHaveBeenCalled()
      expect(productsRepository.add).not.toHaveBeenCalled()
      expect(productSizesRepository.add).not.toHaveBeenCalled()
      expect(eventsRepository.add).not.toHaveBeenCalled()
    })

    it('accepts the largest quantity and price below the numeric limits', async () => {
      await useCase.execute({
        ...portionRequest,
        sizes: [
          { name: 'Máximo', quantity: 999_999_999_999_999, price: 9_999_999_999_999_998 },
        ],
      })

      expect(productSizesRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 999_999_999_999_999,
          price: 9_999_999_999_999_998,
        }),
      )
    })

    it('rejects names that are equal after trimming and lower-casing before starting registration', async () => {
      const rejection = expect(
        useCase.execute({
          ...portionRequest,
          sizes: [
            { name: 'Médio', quantity: 1, price: 5 },
            { name: ' MÉDIO ', quantity: 2, price: 8 },
          ],
        }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow('Já existe um tamanho com esse nome para o produto.')
      expect(database.run).not.toHaveBeenCalled()
      expect(productSizesRepository.add).not.toHaveBeenCalled()
    })

    it('does not commit anything when a later size cannot be saved', async () => {
      productSizesRepository.add
        .mockResolvedValueOnce({} as Awaited<ReturnType<ProductSizesRepository['add']>>)
        .mockRejectedValueOnce(new Error('failed'))

      await expect(useCase.execute(portionRequest)).rejects.toThrow('failed')

      expect(database.run).toHaveBeenCalledTimes(1)
      expect(productSizesRepository.add).toHaveBeenCalledTimes(2)
      expect(stockBalancesRepository.initialize).not.toHaveBeenCalled()
      expect(eventsRepository.add).not.toHaveBeenCalled()
    })

    it('rejects a registration with sizes from a non-manager without starting a transaction', async () => {
      await expect(
        useCase.execute({
          ...portionRequest,
          actor: { ...portionRequest.actor, profile: UserProfile.Operator },
        }),
      ).rejects.toBeInstanceOf(AuthorizationError)

      expect(database.run).not.toHaveBeenCalled()
      expect(productSizesRepository.add).not.toHaveBeenCalled()
    })
  })

  it('persists the selected main brand and records only positive initial stock', async () => {
    productsRepository.add.mockResolvedValue({
      ...product,
      stockControl: ProductStockControl.ByBrand,
    })
    brandsRepository.add
      .mockResolvedValueOnce({
        id: 'brand-1',
        productId: product.id,
        name: 'A',
        packageQuantity: 2,
        packagePrice: 10,
        isPrimary: true,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
      .mockResolvedValueOnce({
        id: 'brand-2',
        productId: product.id,
        name: 'B',
        packageQuantity: 1,
        packagePrice: 4,
        isPrimary: false,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })
    stockBalancesRepository.add.mockResolvedValue({
      productId: product.id,
      brandId: 'brand-1',
      quantity: 3,
      situation: 'normal',
    })

    await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.ByBrand,
      idealStock: 3,
      initialStock: 3,
      brands: [
        {
          name: ' A ',
          unit: ProductUnit.Unit,
          packageQuantity: 2,
          packageValue: 10,
          initialQuantity: 3,
          isPrimary: false,
        },
        {
          name: 'B',
          packageQuantity: 1,
          packageValue: 4,
          initialQuantity: 0,
          isPrimary: true,
        },
      ],
    })

    expect(brandsRepository.add).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: 'A', unit: ProductUnit.Unit, isPrimary: false }),
    )
    expect(brandsRepository.add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ isPrimary: true }),
    )
    expect(stockBalancesRepository.add).toHaveBeenCalledTimes(1)
    expect(stockTransactionsRepository.add).toHaveBeenCalledTimes(1)
    expect(stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'entry',
        brandName: 'A',
        quantity: 3,
        balanceAfter: 3,
        performedByName: 'Manager',
      }),
    )
  })

  it('records negative initial stock for brands when negative stock is enabled', async () => {
    productsRepository.add.mockResolvedValue({
      ...product,
      allowNegativeStock: true,
      stockControl: ProductStockControl.ByBrand,
    })
    brandsRepository.add.mockResolvedValue({
      id: 'brand-1',
      productId: product.id,
      name: 'A',
      packageQuantity: 2,
      packagePrice: 10,
      isPrimary: true,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
    stockBalancesRepository.add.mockResolvedValue({
      productId: product.id,
      brandId: 'brand-1',
      quantity: -3,
      situation: 'normal',
    })

    await useCase.execute({
      actor: {
        id: 'manager-1',
        name: 'Manager',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      },
      name: 'Milk',
      unit: ProductUnit.Liter,
      categories: [ProductCategory.Ingredient],
      stockControl: ProductStockControl.ByBrand,
      allowNegativeStock: true,
      idealStock: 0,
      initialStock: -3,
      brands: [
        {
          name: 'A',
          packageQuantity: 2,
          packageValue: 10,
          initialQuantity: -3,
          isPrimary: true,
        },
      ],
    })

    expect(stockBalancesRepository.add).toHaveBeenCalledWith(
      { productId: product.id, brandId: 'brand-1' },
      -3,
    )
    expect(stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'write-off',
        quantity: 3,
        balanceAfter: -3,
      }),
    )
  })

  it('rejects duplicate and invalid registrations without persistence or events', async () => {
    productsRepository.findByName.mockResolvedValue(product)

    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          name: 'Manager',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        name: 'Milk',
        unit: ProductUnit.Liter,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        idealStock: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictError)

    productsRepository.findByName.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          name: 'Manager',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        name: 'Cake',
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Portion, ProductCategory.Resale],
        stockControl: ProductStockControl.Single,
        idealStock: -1,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects non-manager registration without starting a transaction', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'operator-1',
          name: 'Operator',
          establishmentId: 'establishment-1',
          profile: UserProfile.Operator,
        },
        name: 'Milk',
        unit: ProductUnit.Liter,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        idealStock: 0,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)

    expect(database.run).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects invalid current unit costs without persistence', async () => {
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          name: 'Manager',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        name: 'Milk',
        unit: ProductUnit.Liter,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.Single,
        idealStock: 0,
        currentUnitCost: -0.01,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(productsRepository.add).not.toHaveBeenCalled()
  })

  it.each([
    ['a blank name', { name: '   ' }],
    ['a product without categories', { categories: [] }],
    [
      'a product classified as both portion and resale',
      { categories: [ProductCategory.Portion, ProductCategory.Resale] },
    ],
    [
      'a product classified as both portion and accompaniment',
      { categories: [ProductCategory.Portion, ProductCategory.Accompaniment] },
    ],
    [
      'a manufacturable product with brand stock',
      {
        categories: [ProductCategory.Manufacturable],
        stockControl: ProductStockControl.ByBrand,
        brands: [
          {
            name: 'House',
            packageQuantity: 1,
            packageValue: 5,
            initialQuantity: 0,
            isPrimary: true,
          },
        ],
      },
    ],
    ['a negative ideal stock quantity', { idealStock: -1 }],
    ['negative initial stock when negative stock is disabled', { initialStock: -1 }],
    [
      'a unit cost on a non-ingredient',
      { categories: [ProductCategory.Portion], currentUnitCost: 2 },
    ],
    ['a unit cost with excess decimal places', { currentUnitCost: 1.1234567 }],
  ])('rejects %s before starting registration', async (_description, overrides) => {
    await expect(
      useCase.execute({ ...validSingleStockRequest, ...overrides }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(database.run).not.toHaveBeenCalled()
    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects a missing ideal stock quantity before starting registration', async () => {
    const request = {
      ...validSingleStockRequest,
      idealStock: undefined,
    } as unknown as Parameters<RegisterProductUseCase['execute']>[0]

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(BadRequestError)

    expect(database.run).not.toHaveBeenCalled()
    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it('omits an unspecified current unit cost and skips zero initial stock movements', async () => {
    await useCase.execute({ ...validSingleStockRequest, initialStock: 0 })

    const savedInput = productsRepository.add.mock.calls[0]?.[0]
    expect(savedInput).toBeDefined()
    expect(Object.hasOwn(savedInput ?? {}, 'currentUnitCost')).toBe(false)
    expect(stockBalancesRepository.initialize).toHaveBeenCalledWith(product.id)
    expect(stockBalancesRepository.add).not.toHaveBeenCalled()
    expect(stockTransactionsRepository.add).not.toHaveBeenCalled()
  })

  it('records positive initial stock as an entry using the fixed event time', async () => {
    stockBalancesRepository.add.mockResolvedValue({
      productId: product.id,
      quantity: 4,
      situation: 'normal',
    })

    await useCase.execute({ ...validSingleStockRequest, initialStock: 4 })

    expect(stockBalancesRepository.initialize).toHaveBeenCalledWith(product.id)
    expect(stockBalancesRepository.add).toHaveBeenCalledWith({ productId: product.id }, 4)
    expect(stockTransactionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'entry',
        quantity: 4,
        balanceAfter: 4,
        occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    )
  })

  it('reports the duplicate product conflict with the actionable message', async () => {
    productsRepository.findByName.mockResolvedValue(product)

    await expect(useCase.execute(validSingleStockRequest)).rejects.toThrow(
      'Já existe um produto com esse nome neste estabelecimento.',
    )

    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })

  it.each([
    {
      description: 'no selected brand',
      brands: [
        {
          name: 'A',
          packageQuantity: 2,
          packageValue: 10,
          initialQuantity: 0,
          isPrimary: false,
        },
      ],
    },
    {
      description: 'multiple selected brands',
      brands: [
        {
          name: 'A',
          packageQuantity: 2,
          packageValue: 10,
          initialQuantity: 0,
          isPrimary: true,
        },
        {
          name: 'B',
          packageQuantity: 1,
          packageValue: 4,
          initialQuantity: 0,
          isPrimary: true,
        },
      ],
    },
  ])('rejects $description before starting registration', async ({ brands }) => {
    await expect(
      useCase.execute({
        actor: {
          id: 'manager-1',
          name: 'Manager',
          establishmentId: 'establishment-1',
          profile: UserProfile.Manager,
        },
        name: 'Milk',
        unit: ProductUnit.Liter,
        categories: [ProductCategory.Ingredient],
        stockControl: ProductStockControl.ByBrand,
        idealStock: 0,
        brands,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(database.run).not.toHaveBeenCalled()
    expect(productsRepository.add).not.toHaveBeenCalled()
    expect(eventsRepository.add).not.toHaveBeenCalled()
  })
})
