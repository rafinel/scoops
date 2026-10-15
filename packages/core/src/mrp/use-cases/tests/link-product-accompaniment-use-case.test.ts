import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  BrandFaker,
  ProductAccompanimentFaker,
  ProductFaker,
  ProductSizeFaker,
  ResaleConfigurationFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import type { ProductUpdate } from '#mrp/domain/structures/product-update.ts'
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
  accompanimentPrice: 3.5,
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
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: LinkProductAccompanimentUseCase
  let currentTarget: typeof target

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    currentTarget = target
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : currentTarget,
    )
    scope.productsRepository.replace.mockImplementation(async (...args: unknown[]) => {
      const changes = args.at(-1) as ProductUpdate
      currentTarget = {
        ...currentTarget,
        accompanimentPrice: changes.accompanimentPrice,
      }
      return currentTarget
    })
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
      salePrice: 3.5,
    })
    expect(scope.productAccompanimentsRepository.add).toHaveBeenCalledWith({
      establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
      quantityPerPortion: 1.25,
    })
  })

  it('rejects missing, foreign, or non-Portion owners before writing', async () => {
    const request = {
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      input: {
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      },
    }
    const invalidOwners = [
      { product: undefined, error: NotFoundError },
      {
        product: { ...owner, establishmentId: 'another-establishment' },
        error: NotFoundError,
      },
      {
        product: { ...owner, categories: [ProductCategory.Ingredient] },
        error: BadRequestError,
      },
    ] as const

    for (const { product, error } of invalidOwners) {
      scope.productsRepository.findById.mockClear()
      scope.productsRepository.findById.mockResolvedValue(product)

      await expect(useCase.execute(request)).rejects.toBeInstanceOf(error)
      expect(scope.productsRepository.findById).toHaveBeenCalledTimes(1)
      expect(scope.productsRepository.findById).toHaveBeenCalledWith(
        establishmentId,
        owner.id,
      )
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.findByProductAndAccompaniment,
      ).not.toHaveBeenCalled()
      expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    }
  })

  it('publishes the saved price and filters legacy accompaniment sales configuration', async () => {
    const portion = { ...owner, stockControl: ProductStockControl.ByBrand }
    const pricedTarget = { ...target, currentUnitCost: 1.2 }
    const legacyTarget = ProductFaker.fake({
      id: 'legacy-accompaniment',
      establishmentId,
      name: 'Legacy sauce',
      categories: [ProductCategory.Accompaniment],
      accompanimentPrice: undefined,
    })
    const inactiveTarget = ProductFaker.fake({
      id: 'inactive-accompaniment',
      establishmentId,
      name: 'Inactive sauce',
      categories: [ProductCategory.Accompaniment],
      status: ProductStatus.Inactive,
      accompanimentPrice: 6,
    })
    const legacyLink = ProductAccompanimentFaker.fake({
      id: 'legacy-link',
      establishmentId,
      productId: owner.id,
      accompanimentProductId: legacyTarget.id,
      accompanimentTypeId: type.id,
    })
    const inactiveLink = ProductAccompanimentFaker.fake({
      id: 'inactive-link',
      establishmentId,
      productId: owner.id,
      accompanimentProductId: inactiveTarget.id,
      accompanimentTypeId: type.id,
    })
    const unrelatedLink = ProductAccompanimentFaker.fake({
      id: 'unrelated-link',
      establishmentId,
      productId: 'another-portion',
      accompanimentProductId: legacyTarget.id,
      accompanimentTypeId: type.id,
    })
    const foreignLink = ProductAccompanimentFaker.fake({
      id: 'foreign-link',
      establishmentId: 'another-establishment',
      productId: owner.id,
      accompanimentProductId: legacyTarget.id,
      accompanimentTypeId: type.id,
    })
    const size = ProductSizeFaker.fake({
      id: 'size-1',
      establishmentId,
      productId: owner.id,
      name: 'Regular',
      price: 15,
    })
    const foreignSize = ProductSizeFaker.fake({
      id: 'foreign-size',
      establishmentId: 'another-establishment',
      productId: owner.id,
    })
    const unrelatedSize = ProductSizeFaker.fake({
      id: 'unrelated-size',
      establishmentId,
      productId: 'another-portion',
    })
    const brand = BrandFaker.fake({
      id: 'portion-brand',
      productId: owner.id,
      name: 'House brand',
    })
    const unrelatedBrand = BrandFaker.fake({
      id: 'unrelated-brand',
      productId: 'another-portion',
    })
    const brandedResale = ResaleConfigurationFaker.fake({
      id: 'branded-resale',
      establishmentId,
      productId: owner.id,
      brandId: brand.id,
      price: 18,
    })
    const missingBrandResale = ResaleConfigurationFaker.fake({
      id: 'missing-brand-resale',
      establishmentId,
      productId: owner.id,
      brandId: 'missing-brand',
      price: 19,
      isActive: false,
    })
    const unbrandedResale = ResaleConfigurationFaker.fake({
      id: 'unbranded-resale',
      establishmentId,
      productId: owner.id,
      price: 20,
    })
    const foreignResale = ResaleConfigurationFaker.fake({
      id: 'foreign-resale',
      establishmentId: 'another-establishment',
      productId: owner.id,
    })
    const unrelatedResale = ResaleConfigurationFaker.fake({
      id: 'unrelated-resale',
      establishmentId,
      productId: 'another-portion',
    })
    scope.productsRepository.findById.mockImplementation(async (_, id) => {
      if (id === owner.id) return portion
      if (id === target.id) return pricedTarget
      if (id === legacyTarget.id) return legacyTarget
      if (id === inactiveTarget.id) return inactiveTarget
      return undefined
    })
    scope.productSizesRepository.findManyByProductId.mockResolvedValue([
      size,
      foreignSize,
      unrelatedSize,
    ])
    scope.productAccompanimentsRepository.findManyByProductId.mockResolvedValue([
      link,
      legacyLink,
      inactiveLink,
      unrelatedLink,
      foreignLink,
    ])
    scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([
      brandedResale,
      missingBrandResale,
      unbrandedResale,
      foreignResale,
      unrelatedResale,
    ])
    scope.brandsRepository.findManyByProductId.mockResolvedValue([brand, unrelatedBrand])

    const result = await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      input: {
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1.25,
      },
    })

    expect(result).toMatchObject({ salePrice: 3.5, unitCost: 1.2, estimatedCost: 1.5 })
    expect(scope.eventsRepository.add).toHaveBeenCalledTimes(1)
    expect(scope.eventsRepository.add.mock.calls[0][0]).toMatchObject({
      payload: {
        productId: owner.id,
        configuration: {
          sizes: [
            {
              sizeId: size.id,
              accompaniments: [
                {
                  accompanimentId: link.id,
                  basePrice: 3.5,
                  isActive: true,
                },
                {
                  accompanimentId: legacyLink.id,
                  basePrice: 0,
                  isActive: false,
                },
                {
                  accompanimentId: inactiveLink.id,
                  basePrice: 6,
                  isActive: false,
                },
              ],
            },
          ],
          resaleConfigurations: [
            { brandId: brand.id, brandName: brand.name, price: 18, isActive: true },
            { brandId: 'missing-brand', price: 19, isActive: false },
            { price: 20, isActive: true },
          ],
        },
      },
    })
  })

  it('uses the primary Brand cost without changing the saved accompaniment price', async () => {
    const byBrandTarget = {
      ...target,
      stockControl: ProductStockControl.ByBrand,
      currentUnitCost: undefined,
    }
    const mainBrand = BrandFaker.fake({
      id: 'target-brand',
      productId: target.id,
      name: 'Primary packaging',
      packageQuantity: 4,
      packagePrice: 12,
    })
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : byBrandTarget,
    )
    scope.brandsRepository.findManyByProductId.mockResolvedValue([mainBrand])

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
      salePrice: 3.5,
      brandId: mainBrand.id,
      brandName: mainBrand.name,
      unitCost: 3,
      estimatedCost: 3.75,
    })
    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(target.id)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('saves a zero accompaniment price with the first link and publishes every inverse owner', async () => {
    currentTarget = { ...target, accompanimentPrice: undefined }
    const anotherPortion = ProductFaker.fake({
      id: 'portion-2',
      establishmentId,
      categories: [ProductCategory.Portion],
    })
    const secondLink = ProductAccompanimentFaker.fake({
      id: 'link-2',
      establishmentId,
      productId: anotherPortion.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
    })
    scope.productsRepository.findById.mockImplementation(async (_, id) =>
      id === owner.id ? owner : id === anotherPortion.id ? anotherPortion : currentTarget,
    )
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [link, secondLink],
    )
    scope.productAccompanimentsRepository.add.mockImplementation(async (input) => ({
      ...link,
      ...input,
    }))

    const result = await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      input: {
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
        accompanimentPrice: 0,
      },
    })

    expect(result.salePrice).toBe(0)
    expect(scope.productsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      target.id,
      { accompanimentPrice: 0 },
    )
    const publishedIds = scope.eventsRepository.add.mock.calls.map(([event]) =>
      event instanceof ProductSalesConfigurationChangedEvent
        ? event.payload.productId
        : undefined,
    )
    expect(publishedIds).toEqual(expect.arrayContaining([owner.id, anotherPortion.id]))
  })

  it('rejects missing or invalid prices before writing the Product or link', async () => {
    currentTarget = { ...target, accompanimentPrice: undefined }
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        input: {
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    currentTarget = { ...target, accompanimentPrice: -1 }
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        input: {
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 1,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    currentTarget = { ...target, accompanimentPrice: undefined }
    for (const accompanimentPrice of [-0.01, 1.234, Number.NaN]) {
      await expect(
        useCase.execute({
          actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
          productId: owner.id,
          input: {
            accompanimentProductId: target.id,
            accompanimentTypeId: type.id,
            quantityPerPortion: 1,
            accompanimentPrice,
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestError)
    }
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects invalid quantity, duplicate, inactive/wrong-category, foreign type and non-manager branches before writing', async () => {
    const request = {
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      input: {
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 1,
      },
    }
    for (const quantityPerPortion of [
      0,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      1.2345,
    ]) {
      await expect(
        useCase.execute({ ...request, input: { ...request.input, quantityPerPortion } }),
      ).rejects.toBeInstanceOf(BadRequestError)
    }
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

    for (const brand of [
      BrandFaker.fake({ productId: 'another-product', isPrimary: true }),
      BrandFaker.fake({ productId: target.id, isPrimary: false }),
    ]) {
      scope.brandsRepository.findManyByProductId.mockResolvedValue([brand])
      await expect(
        useCase.execute({
          ...request,
          input: { ...request.input, quantityPerPortion: 1 },
        }),
      ).rejects.toBeInstanceOf(BadRequestError)
    }
    expect(scope.productAccompanimentsRepository.add).not.toHaveBeenCalled()

    await expect(
      useCase.execute({
        ...request,
        actor: { ...request.actor, profile: UserProfile.Operator },
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})
