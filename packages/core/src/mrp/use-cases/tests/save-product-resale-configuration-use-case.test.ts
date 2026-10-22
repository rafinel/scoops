import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
  ResaleConfigurationFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
import {
  ProductCategory,
  ProductStatus,
  ProductStockControl,
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
import { SaveProductResaleConfigurationUseCase } from '#mrp/use-cases/save-product-resale-configuration-use-case.ts'

const establishmentId = 'establishment-1'
const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
const singleProduct = ProductFaker.fake({
  id: 'single-1',
  establishmentId,
  categories: [ProductCategory.Resale],
  stockControl: ProductStockControl.Single,
  currentUnitCost: undefined,
})
const byBrandProduct = ProductFaker.fake({
  id: 'by-brand-1',
  establishmentId,
  categories: [ProductCategory.Resale],
  stockControl: ProductStockControl.ByBrand,
  currentUnitCost: undefined,
})
const brand = {
  id: 'brand-1',
  productId: byBrandProduct.id,
  name: 'Main Brand',
  packageQuantity: 4,
  packagePrice: 20,
  isPrimary: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('Save Product Resale Configuration Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: SaveProductResaleConfigurationUseCase
  let singleConfiguration: ResaleConfiguration | undefined
  let brandConfiguration: ResaleConfiguration | undefined

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    singleConfiguration = undefined
    brandConfiguration = undefined
    scope.productsRepository.findById.mockImplementation(
      async (_establishment, productId) => {
        if (productId === singleProduct.id) return singleProduct
        if (productId === byBrandProduct.id) return byBrandProduct
        return undefined
      },
    )
    scope.brandsRepository.findById.mockImplementation(async (_productId, brandId) => {
      return brandId === brand.id ? brand : undefined
    })
    scope.brandsRepository.findManyByProductId.mockResolvedValue([brand])
    scope.resaleConfigurationsRepository.findByProductAndBrand.mockImplementation(
      async (_establishment, productId, brandId) => {
        if (productId === singleProduct.id && brandId === undefined) {
          return singleConfiguration
        }
        if (productId === byBrandProduct.id && brandId === brand.id) {
          return brandConfiguration
        }
        return undefined
      },
    )
    scope.resaleConfigurationsRepository.findManyByProductId.mockImplementation(
      async (_establishment, productId) => {
        if (productId === byBrandProduct.id && brandConfiguration) {
          return [brandConfiguration]
        }
        return []
      },
    )
    scope.resaleConfigurationsRepository.add.mockImplementation(async (input) => {
      const configuration = ResaleConfigurationFaker.fake({
        id: input.brandId ? 'brand-configuration' : 'single-configuration',
        ...input,
      })
      if (input.brandId) brandConfiguration = configuration
      else singleConfiguration = configuration
      return configuration
    })
    scope.resaleConfigurationsRepository.replace.mockImplementation(
      async (_establishment, _productId, configurationId, changes) => {
        const current =
          configurationId === 'single-configuration'
            ? singleConfiguration
            : brandConfiguration
        if (!current) throw new Error('Expected an existing resale configuration.')
        const configuration = { ...current, ...changes }
        if (configurationId === 'single-configuration')
          singleConfiguration = configuration
        else brandConfiguration = configuration
        return configuration
      },
    )
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [],
    )
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockImplementation(
      async (_establishment, productIds) =>
        productIds.flatMap((productId) => {
          if (productId === singleProduct.id) {
            return [
              ProductSalesConfigurationSourceFaker.fake({
                product: singleProduct,
                resaleConfigurations: singleConfiguration ? [singleConfiguration] : [],
              }),
            ]
          }
          if (productId === byBrandProduct.id) {
            return [
              ProductSalesConfigurationSourceFaker.fake({
                product: byBrandProduct,
                resaleConfigurations: brandConfiguration ? [brandConfiguration] : [],
                brands: [brand],
              }),
            ]
          }
          return []
        }),
    )
    useCase = new SaveProductResaleConfigurationUseCase(database)
  })

  it('creates and returns the Single-stock configuration with package quantity one', async () => {
    const result = await useCase.execute({
      actor,
      productId: singleProduct.id,
      input: { price: 8.5, isActive: true },
    })

    expect(scope.resaleConfigurationsRepository.add).toHaveBeenCalledWith({
      establishmentId,
      productId: singleProduct.id,
      price: 8.5,
      isActive: true,
    })
    expect(result).toMatchObject({
      mode: 'resale-single',
      resale: [{ packageQuantity: 1, price: 8.5, isActive: true }],
    })
  })

  it('updates an existing Single configuration idempotently without adding a duplicate', async () => {
    singleConfiguration = ResaleConfigurationFaker.fake({
      id: 'single-configuration',
      establishmentId,
      productId: singleProduct.id,
      price: 5,
      isActive: false,
    })

    await useCase.execute({
      actor,
      productId: singleProduct.id,
      input: { price: 6, isActive: true },
    })

    expect(scope.resaleConfigurationsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      singleProduct.id,
      'single-configuration',
      { price: 6, isActive: true },
    )
    expect(scope.resaleConfigurationsRepository.add).not.toHaveBeenCalled()
  })

  it('saves only the owned By-brand configuration and inherits package facts', async () => {
    const result = await useCase.execute({
      actor,
      productId: byBrandProduct.id,
      brandId: brand.id,
      input: { price: 15, isActive: true },
    })

    expect(scope.resaleConfigurationsRepository.add).toHaveBeenCalledWith({
      establishmentId,
      productId: byBrandProduct.id,
      brandId: brand.id,
      price: 15,
      isActive: true,
    })
    expect(result).toMatchObject({
      mode: 'resale-by-brand',
      resale: [{ brand, packageQuantity: 4, price: 15, isActive: true }],
    })
  })

  it('rejects wrong modes, missing or foreign brands, invalid input and non-Managers', async () => {
    await expect(
      useCase.execute({
        actor,
        productId: byBrandProduct.id,
        input: { price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    await expect(
      useCase.execute({
        actor,
        productId: singleProduct.id,
        brandId: brand.id,
        input: { price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    await expect(
      useCase.execute({
        actor,
        productId: byBrandProduct.id,
        brandId: 'foreign-brand',
        input: { price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    await expect(
      useCase.execute({
        actor,
        productId: singleProduct.id,
        input: { price: 10.001, isActive: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    await expect(
      useCase.execute({
        actor: { ...actor, profile: UserProfile.Operator },
        productId: singleProduct.id,
        input: { price: 10, isActive: true },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  describe.each([
    ['Single', { productId: singleProduct.id }],
    ['By-brand', { productId: byBrandProduct.id, brandId: brand.id }],
  ])('a %s price', (_mode, target) => {
    it.each([
      ['the numeric(18,2) limit of 10^16', 10_000_000_000_000_000],
      ['a negative number', -0.01],
      ['three decimal places', 10.001],
      ['a floating-point artifact', 0.30000000000000004],
      ['not a number', Number.NaN],
      ['infinite', Number.POSITIVE_INFINITY],
    ])('rejects %s without starting a transaction', async (_name, price) => {
      const rejection = expect(
        useCase.execute({ actor, ...target, input: { price, isActive: true } }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow(
        'O preço deve ser não negativo e possuir até duas casas decimais.',
      )
      expect(database.run).not.toHaveBeenCalled()
      expect(scope.resaleConfigurationsRepository.add).not.toHaveBeenCalled()
      expect(scope.resaleConfigurationsRepository.replace).not.toHaveBeenCalled()
    })

    it.each([0, 1_234_567.89])('saves the valid price %s', async (price) => {
      await useCase.execute({ actor, ...target, input: { price, isActive: true } })

      expect(scope.resaleConfigurationsRepository.add).toHaveBeenCalledWith(
        expect.objectContaining({ productId: target.productId, price, isActive: true }),
      )
    })
  })

  it('keeps an existing configuration unchanged when the new price is rejected', async () => {
    singleConfiguration = ResaleConfigurationFaker.fake({
      id: 'single-configuration',
      establishmentId,
      productId: singleProduct.id,
      price: 5,
      isActive: true,
    })

    await expect(
      useCase.execute({
        actor,
        productId: singleProduct.id,
        input: { price: 10_000_000_000_000_000, isActive: true },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(singleConfiguration?.price).toBe(5)
    expect(scope.resaleConfigurationsRepository.replace).not.toHaveBeenCalled()
  })

  describe('eligibility', () => {
    const validInput = { price: 10, isActive: true }

    it('rejects an unknown product', async () => {
      const rejection = expect(
        useCase.execute({ actor, productId: 'missing-product', input: validInput }),
      ).rejects

      await rejection.toBeInstanceOf(NotFoundError)
      await rejection.toThrow('Produto não encontrado.')
      expect(scope.resaleConfigurationsRepository.add).not.toHaveBeenCalled()
    })

    it('rejects a product from another establishment as not found', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...singleProduct,
        establishmentId: 'foreign-establishment',
      })

      const rejection = expect(
        useCase.execute({ actor, productId: singleProduct.id, input: validInput }),
      ).rejects

      await rejection.toBeInstanceOf(NotFoundError)
      await rejection.toThrow('Produto não encontrado.')
      expect(scope.resaleConfigurationsRepository.add).not.toHaveBeenCalled()
    })

    it.each([
      [
        'a product without the Resale category',
        [ProductCategory.Ingredient],
        'O produto não é uma revenda.',
      ],
      [
        'a Portion product',
        [ProductCategory.Resale, ProductCategory.Portion],
        'Porção e Revenda não podem ser usadas juntas.',
      ],
    ])('rejects %s', async (_name, categories, message) => {
      scope.productsRepository.findById.mockResolvedValue({
        ...singleProduct,
        categories,
      })

      const rejection = expect(
        useCase.execute({ actor, productId: singleProduct.id, input: validInput }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow(message)
      expect(scope.resaleConfigurationsRepository.add).not.toHaveBeenCalled()
    })

    it('rejects a product with an unsupported stock control', async () => {
      scope.productsRepository.findById.mockResolvedValue({
        ...singleProduct,
        stockControl: 'unsupported' as ProductStockControl,
      })

      const rejection = expect(
        useCase.execute({ actor, productId: singleProduct.id, input: validInput }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow('O controle de estoque do produto não é suportado.')
    })

    it('rejects a brand on a Single-stock product', async () => {
      const rejection = expect(
        useCase.execute({
          actor,
          productId: singleProduct.id,
          brandId: brand.id,
          input: validInput,
        }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow('O produto de estoque único não possui marcas.')
    })

    it('requires a brand for a By-brand product', async () => {
      const rejection = expect(
        useCase.execute({ actor, productId: byBrandProduct.id, input: validInput }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow('Informe a marca da configuração de revenda.')
    })

    it.each([
      ['an unknown brand', 'missing-brand'],
      ['a brand of another product', 'other-product-brand'],
    ])('rejects %s as not found', async (_name, brandId) => {
      scope.brandsRepository.findById.mockResolvedValue(
        brandId === 'other-product-brand'
          ? { ...brand, id: brandId, productId: 'other-product' }
          : undefined,
      )

      const rejection = expect(
        useCase.execute({
          actor,
          productId: byBrandProduct.id,
          brandId,
          input: validInput,
        }),
      ).rejects

      await rejection.toBeInstanceOf(NotFoundError)
      await rejection.toThrow('Marca não encontrada.')
      expect(scope.resaleConfigurationsRepository.add).not.toHaveBeenCalled()
    })

    it('requires a boolean availability', async () => {
      const rejection = expect(
        useCase.execute({
          actor,
          productId: singleProduct.id,
          input: { price: 10, isActive: 'yes' as unknown as boolean },
        }),
      ).rejects

      await rejection.toBeInstanceOf(BadRequestError)
      await rejection.toThrow('O status da configuração é obrigatório.')
      expect(database.run).not.toHaveBeenCalled()
    })

    it('limits saving to Managers', async () => {
      const rejection = expect(
        useCase.execute({
          actor: { ...actor, profile: UserProfile.Operator },
          productId: singleProduct.id,
          input: validInput,
        }),
      ).rejects

      await rejection.toBeInstanceOf(AuthorizationError)
      await rejection.toThrow('Somente gestores podem salvar preços de revenda.')
      expect(database.run).not.toHaveBeenCalled()
    })

    it.each([
      ['another establishment', { establishmentId: 'foreign-establishment' }],
      ['another product', { productId: 'other-product' }],
      ['a brand', { brandId: 'unexpected-brand' }],
    ])(
      'does not replace a Single configuration owned by %s',
      async (_name, overrides) => {
        singleConfiguration = ResaleConfigurationFaker.fake({
          id: 'single-configuration',
          establishmentId,
          productId: singleProduct.id,
          price: 5,
          isActive: true,
          ...overrides,
        })

        const rejection = expect(
          useCase.execute({ actor, productId: singleProduct.id, input: validInput }),
        ).rejects

        await rejection.toBeInstanceOf(NotFoundError)
        await rejection.toThrow('Configuração de revenda não encontrada.')
        expect(scope.resaleConfigurationsRepository.replace).not.toHaveBeenCalled()
      },
    )

    it('does not replace a By-brand configuration owned by another brand', async () => {
      brandConfiguration = ResaleConfigurationFaker.fake({
        id: 'brand-configuration',
        establishmentId,
        productId: byBrandProduct.id,
        brandId: 'another-brand',
        price: 5,
        isActive: true,
      })

      const rejection = expect(
        useCase.execute({
          actor,
          productId: byBrandProduct.id,
          brandId: brand.id,
          input: validInput,
        }),
      ).rejects

      await rejection.toBeInstanceOf(NotFoundError)
      await rejection.toThrow('Configuração de revenda não encontrada.')
      expect(scope.resaleConfigurationsRepository.replace).not.toHaveBeenCalled()
    })
  })

  it('publishes the saved Single configuration once for the product', async () => {
    await useCase.execute({
      actor,
      productId: singleProduct.id,
      input: { price: 8.5, isActive: true },
    })

    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith(establishmentId, [singleProduct.id])
    expect(scope.eventsRepository.add).toHaveBeenCalledExactlyOnceWith(
      new ProductSalesConfigurationChangedEvent({
        establishmentId,
        productId: singleProduct.id,
        state: 'available',
        configuration: {
          establishmentId,
          productId: singleProduct.id,
          name: singleProduct.name,
          categories: [ProductCategory.Resale],
          status: singleProduct.status,
          stockControl: ProductStockControl.Single,
          sizes: [],
          resaleConfigurations: [{ price: 8.5, isActive: true }],
          updatedAt: new Date(
            Math.max(
              singleProduct.updatedAt.getTime(),
              (singleConfiguration as ResaleConfiguration).updatedAt.getTime(),
            ),
          ),
        },
      }),
    )
  })

  it('ignores brand updates for a Single-stock product but counts them for a By-brand product', async () => {
    const brandUpdatedAt = new Date('2030-01-01T00:00:00.000Z')
    const updatedBrand = { ...brand, updatedAt: brandUpdatedAt }
    const published = (productId: string) =>
      scope.eventsRepository.add.mock.calls
        .map(([event]) => event as ProductSalesConfigurationChangedEvent)
        .find((event) => event.payload.productId === productId)?.payload.configuration
        ?.updatedAt
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockImplementation(
      async (_establishment, [productId]) => [
        ProductSalesConfigurationSourceFaker.fake({
          product: productId === singleProduct.id ? singleProduct : byBrandProduct,
          brands: [{ ...updatedBrand, productId }],
        }),
      ],
    )

    await useCase.execute({
      actor,
      productId: singleProduct.id,
      input: { price: 8.5, isActive: true },
    })
    await useCase.execute({
      actor,
      productId: byBrandProduct.id,
      brandId: brand.id,
      input: { price: 15, isActive: true },
    })

    expect(published(singleProduct.id)).toEqual(singleProduct.updatedAt)
    expect(published(byBrandProduct.id)).toEqual(brandUpdatedAt)
  })

  it('filters foreign child rows and maps By-brand resale names into the published configuration', async () => {
    const ownerUpdatedAt = new Date('2026-01-01T00:00:00.000Z')
    const sizeUpdatedAt = new Date('2026-01-02T00:00:00.000Z')
    const linkUpdatedAt = new Date('2026-01-03T00:00:00.000Z')
    const typeUpdatedAt = new Date('2026-01-04T00:00:00.000Z')
    const accompanimentUpdatedAt = new Date('2026-01-05T00:00:00.000Z')
    const configurationUpdatedAt = new Date('2026-01-06T00:00:00.000Z')
    const brandUpdatedAt = new Date('2026-01-07T00:00:00.000Z')
    const owner = { ...byBrandProduct, updatedAt: ownerUpdatedAt }
    const accompaniment = ProductFaker.fake({
      id: 'accompaniment-1',
      establishmentId,
      name: 'Granola',
      categories: [ProductCategory.Accompaniment],
      status: ProductStatus.Active,
      updatedAt: accompanimentUpdatedAt,
    })
    const type = AccompanimentTypeFaker.fake({
      id: 'type-1',
      establishmentId,
      name: 'Cobertura',
      updatedAt: typeUpdatedAt,
    })
    const validSize = ProductSizeFaker.fake({
      id: 'size-1',
      establishmentId,
      productId: owner.id,
      name: 'Médio',
      price: 12,
      updatedAt: sizeUpdatedAt,
    })
    const validLink = ProductAccompanimentFaker.fake({
      id: 'link-1',
      establishmentId,
      productId: owner.id,
      accompanimentProductId: accompaniment.id,
      accompanimentTypeId: type.id,
      accompanimentPrice: 0,
      updatedAt: linkUpdatedAt,
    })
    const mappedBrand = { ...brand, name: 'Mãe Terra', updatedAt: brandUpdatedAt }
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockResolvedValue(
      [
        ProductSalesConfigurationSourceFaker.fake({
          product: owner,
          sizes: [
            validSize,
            ProductSizeFaker.fake({
              id: 'size-foreign-establishment',
              establishmentId: 'establishment-2',
              productId: owner.id,
              updatedAt: new Date('2025-12-01T00:00:00.000Z'),
            }),
            ProductSizeFaker.fake({
              id: 'size-other-product',
              establishmentId,
              productId: 'other-product',
              updatedAt: new Date('2025-12-02T00:00:00.000Z'),
            }),
          ],
          links: [
            validLink,
            ProductAccompanimentFaker.fake({
              id: 'link-foreign-establishment',
              establishmentId: 'establishment-2',
              productId: owner.id,
              accompanimentProductId: accompaniment.id,
              accompanimentTypeId: type.id,
              updatedAt: new Date('2025-12-03T00:00:00.000Z'),
            }),
            ProductAccompanimentFaker.fake({
              id: 'link-other-product',
              establishmentId,
              productId: 'other-product',
              accompanimentProductId: accompaniment.id,
              accompanimentTypeId: type.id,
              updatedAt: new Date('2025-12-04T00:00:00.000Z'),
            }),
          ],
          resaleConfigurations: [
            ResaleConfigurationFaker.fake({
              id: 'resale-1',
              establishmentId,
              productId: owner.id,
              brandId: mappedBrand.id,
              price: 18,
              isActive: true,
              updatedAt: configurationUpdatedAt,
            }),
            ResaleConfigurationFaker.fake({
              id: 'resale-unknown-brand',
              establishmentId,
              productId: owner.id,
              brandId: 'brand-unknown',
              price: 19,
              isActive: false,
            }),
            ResaleConfigurationFaker.fake({
              id: 'resale-unbranded',
              establishmentId,
              productId: owner.id,
              brandId: undefined,
              price: 20,
              isActive: true,
            }),
            ResaleConfigurationFaker.fake({
              id: 'resale-foreign-establishment',
              establishmentId: 'establishment-2',
              productId: owner.id,
              price: 21,
              updatedAt: new Date('2025-12-05T00:00:00.000Z'),
            }),
            ResaleConfigurationFaker.fake({
              id: 'resale-other-product',
              establishmentId,
              productId: 'other-product',
              price: 22,
              updatedAt: new Date('2025-12-06T00:00:00.000Z'),
            }),
          ],
          brands: [mappedBrand],
          accompanimentProducts: [accompaniment],
          accompanimentTypes: [type],
        }),
      ],
    )

    await useCase.execute({
      actor,
      productId: owner.id,
      brandId: brand.id,
      input: { price: 18, isActive: true },
    })

    const [[event]] = scope.eventsRepository.add.mock.calls
    const { configuration } = (event as ProductSalesConfigurationChangedEvent).payload
    expect(configuration?.sizes).toEqual([
      {
        sizeId: validSize.id,
        name: validSize.name,
        price: validSize.price,
        isActive: validSize.isActive,
        accompaniments: [
          {
            accompanimentId: validLink.id,
            productId: accompaniment.id,
            name: accompaniment.name,
            type: type.name,
            basePrice: 0,
            isActive: true,
          },
        ],
      },
    ])
    expect(configuration?.resaleConfigurations).toEqual([
      { brandId: mappedBrand.id, brandName: 'Mãe Terra', price: 18, isActive: true },
      { brandId: 'brand-unknown', price: 19, isActive: false },
      { price: 20, isActive: true },
    ])
    expect(configuration?.updatedAt).toEqual(brandUpdatedAt)
  })

  it('publishes nothing when the product is not eligible', async () => {
    await expect(
      useCase.execute({
        actor,
        productId: 'unknown-product',
        input: { price: 8.5, isActive: true },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })
})
