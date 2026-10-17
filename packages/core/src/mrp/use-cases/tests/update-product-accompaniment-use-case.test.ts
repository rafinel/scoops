import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  AccompanimentTypeFaker,
  BrandFaker,
  GlobalAccompanimentFaker,
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
  accompanimentPrice: 2.3,
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
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: UpdateProductAccompanimentUseCase
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
    scope.productAccompanimentsRepository.findById.mockResolvedValue(link)
    scope.accompanimentTypesRepository.findById.mockResolvedValue(type)
    scope.productAccompanimentsRepository.replace.mockResolvedValue(updated)
    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      1,
    )
    useCase = new UpdateProductAccompanimentUseCase(database)
  })

  it('changes only type and quantity while retaining the target and saved product price', async () => {
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
      salePrice: 2.3,
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
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
  })

  it('updates the Product price with the link and publishes every inverse Portion owner', async () => {
    const anotherOwner = ProductFaker.fake({
      id: 'portion-2',
      establishmentId,
      categories: [ProductCategory.Portion],
    })
    const portion = { ...owner, stockControl: ProductStockControl.ByBrand }
    const secondLink = ProductAccompanimentFaker.fake({
      id: 'link-2',
      establishmentId,
      productId: anotherOwner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
    })
    const duplicateLink = ProductAccompanimentFaker.fake({
      id: 'duplicate-owner-link',
      establishmentId,
      productId: owner.id,
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
    })
    const foreignLink = ProductAccompanimentFaker.fake({
      id: 'foreign-owner-link',
      establishmentId: 'another-establishment',
      productId: 'foreign-portion',
      accompanimentProductId: target.id,
      accompanimentTypeId: type.id,
    })
    const legacyTarget = ProductFaker.fake({
      id: 'legacy-accompaniment',
      establishmentId,
      name: 'Legacy sauce',
      categories: [ProductCategory.Accompaniment],
      accompanimentPrice: undefined,
    })
    const legacyLink = ProductAccompanimentFaker.fake({
      id: 'legacy-link',
      establishmentId,
      productId: owner.id,
      accompanimentProductId: legacyTarget.id,
      accompanimentTypeId: type.id,
    })
    const unrelatedLink = ProductAccompanimentFaker.fake({
      id: 'unrelated-link',
      establishmentId,
      productId: anotherOwner.id,
      accompanimentProductId: target.id,
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
      productId: anotherOwner.id,
    })
    const brand = BrandFaker.fake({
      id: 'portion-brand',
      productId: owner.id,
      name: 'House brand',
    })
    const unrelatedBrand = BrandFaker.fake({
      id: 'unrelated-brand',
      productId: anotherOwner.id,
    })
    const brandedResale = ResaleConfigurationFaker.fake({
      id: 'branded-resale',
      establishmentId,
      productId: owner.id,
      brandId: brand.id,
      price: 18,
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
      productId: anotherOwner.id,
    })
    scope.productsRepository.findById.mockImplementation(async (_, id) => {
      if (id === owner.id) return portion
      if (id === anotherOwner.id) return anotherOwner
      if (id === legacyTarget.id) return legacyTarget
      return currentTarget
    })
    scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
      [link, secondLink, duplicateLink, foreignLink],
    )
    scope.productAccompanimentsRepository.findManyByProductId.mockImplementation(
      async (_, productId) =>
        productId === owner.id ? [updated, legacyLink] : [unrelatedLink],
    )
    scope.productSizesRepository.findManyByProductId.mockImplementation(
      async (_, productId) =>
        productId === owner.id ? [size, foreignSize, unrelatedSize] : [],
    )
    scope.resaleConfigurationsRepository.findManyByProductId.mockResolvedValue([
      brandedResale,
      unbrandedResale,
      foreignResale,
      unrelatedResale,
    ])
    scope.brandsRepository.findManyByProductId.mockResolvedValue([brand, unrelatedBrand])
    scope.productAccompanimentsRepository.replace.mockImplementation(async () => updated)
    const writeOrder: string[] = []
    const publishedEvents: ProductSalesConfigurationChangedEvent[] = []
    scope.productsRepository.replace.mockImplementation(async (...args: unknown[]) => {
      const changes = args.at(-1) as ProductUpdate
      writeOrder.push(`price:${changes.accompanimentPrice}`)
      currentTarget = {
        ...currentTarget,
        accompanimentPrice: changes.accompanimentPrice,
      }
      return currentTarget
    })
    scope.productAccompanimentsRepository.replace.mockImplementation(async () => {
      writeOrder.push('link')
      return updated
    })
    scope.eventsRepository.add.mockImplementation(async (event) => {
      if (event instanceof ProductSalesConfigurationChangedEvent) {
        publishedEvents.push(event)
        writeOrder.push(`event:${event.payload.productId}`)
      }
    })

    const result = await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      linkId: link.id,
      input: {
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.75,
        accompanimentPrice: 4.99,
      },
    })

    expect(result.salePrice).toBe(4.99)
    expect(scope.productsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      target.id,
      { accompanimentPrice: 4.99 },
    )
    expect(scope.productAccompanimentsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      owner.id,
      link.id,
      { accompanimentTypeId: type.id, quantityPerPortion: 0.75 },
    )
    expect(writeOrder.slice(0, 2)).toEqual(['price:4.99', 'link'])
    expect(writeOrder.filter((entry) => entry.startsWith('event:'))).toEqual([
      `event:${owner.id}`,
      `event:${anotherOwner.id}`,
    ])
    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).toHaveBeenCalledWith(establishmentId, target.id)
    expect(publishedEvents[0]?.payload).toMatchObject({
      productId: owner.id,
      configuration: {
        sizes: [
          {
            sizeId: size.id,
            accompaniments: [
              { accompanimentId: link.id, basePrice: 4.99, isActive: true },
              { accompanimentId: legacyLink.id, basePrice: 0, isActive: false },
            ],
          },
        ],
        resaleConfigurations: [
          { brandId: brand.id, brandName: brand.name, price: 18, isActive: true },
          { price: 20, isActive: true },
        ],
      },
    })
  })

  it.each([
    {
      description: 'a missing owner',
      ownerProduct: undefined,
      error: NotFoundError,
    },
    {
      description: 'an owner from another establishment',
      ownerProduct: { ...owner, establishmentId: 'another-establishment' },
      error: NotFoundError,
    },
    {
      description: 'an owner that is not a Portion',
      ownerProduct: { ...owner, categories: [ProductCategory.Ingredient] },
      error: BadRequestError,
    },
  ])(
    'rejects $description before changing the link or price',
    async ({ ownerProduct, error }) => {
      scope.productsRepository.findById.mockResolvedValue(ownerProduct)

      await expect(
        useCase.execute({
          actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
          productId: owner.id,
          linkId: link.id,
          input: { accompanimentTypeId: type.id, quantityPerPortion: 0.75 },
        }),
      ).rejects.toBeInstanceOf(error)

      expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    },
  )

  it.each([
    {
      description: 'a link returned from another establishment',
      returnedLink: { ...link, establishmentId: 'another-establishment' },
    },
    {
      description: 'a link owned by another product',
      returnedLink: { ...link, productId: 'another-portion' },
    },
  ])('hides $description before resolving the target', async ({ returnedLink }) => {
    scope.productAccompanimentsRepository.findById.mockResolvedValue(returnedLink)

    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        linkId: link.id,
        input: { accompanimentTypeId: type.id, quantityPerPortion: 0.75 },
      }),
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(scope.productsRepository.findById).toHaveBeenCalledOnce()
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
  })

  it.each([
    {
      description: 'a missing target',
      targetProduct: undefined,
      error: NotFoundError,
    },
    {
      description: 'a target from another establishment',
      targetProduct: { ...target, establishmentId: 'another-establishment' },
      error: NotFoundError,
    },
    {
      description: 'the owner product itself',
      targetProduct: owner,
      error: BadRequestError,
    },
    {
      description: 'an inactive target',
      targetProduct: { ...target, status: ProductStatus.Inactive },
      error: BadRequestError,
    },
    {
      description: 'a target outside the Accompaniment category',
      targetProduct: { ...target, categories: [ProductCategory.Ingredient] },
      error: BadRequestError,
    },
  ])(
    'rejects $description before changing the link or price',
    async ({ targetProduct, error }) => {
      scope.productsRepository.findById.mockImplementation(async (_, id) =>
        id === owner.id ? owner : targetProduct,
      )

      await expect(
        useCase.execute({
          actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
          productId: owner.id,
          linkId: link.id,
          input: { accompanimentTypeId: type.id, quantityPerPortion: 0.75 },
        }),
      ).rejects.toBeInstanceOf(error)

      expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    },
  )

  it('updates a retained legacy link whose target also has the Portion category', async () => {
    currentTarget = {
      ...target,
      categories: [ProductCategory.Accompaniment, ProductCategory.Portion],
      accompanimentPrice: undefined,
    }

    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        linkId: link.id,
        input: {
          accompanimentTypeId: type.id,
          quantityPerPortion: 0.75,
          accompanimentPrice: 4.99,
        },
      }),
    ).resolves.toMatchObject({
      accompanimentProductId: target.id,
      salePrice: 4.99,
    })

    expect(scope.productsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      target.id,
      { accompanimentPrice: 4.99 },
    )
    expect(scope.productAccompanimentsRepository.replace).toHaveBeenCalledOnce()
  })

  it('rejects a ByBrand target without its own primary brand before writing', async () => {
    currentTarget = { ...target, stockControl: ProductStockControl.ByBrand }
    scope.brandsRepository.findManyByProductId.mockResolvedValue([])

    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        linkId: link.id,
        input: {
          accompanimentTypeId: type.id,
          quantityPerPortion: 0.75,
          accompanimentPrice: 4.99,
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)

    expect(scope.brandsRepository.findManyByProductId).toHaveBeenCalledWith(target.id)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
  })

  it('projects the primary brand cost for a ByBrand accompaniment target', async () => {
    currentTarget = { ...target, stockControl: ProductStockControl.ByBrand }
    const brand = BrandFaker.fake({
      id: 'target-brand',
      productId: target.id,
      name: 'House brand',
      packageQuantity: 4,
      packagePrice: 10,
      isPrimary: true,
    })
    scope.brandsRepository.findManyByProductId.mockResolvedValue([brand])

    const result = await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      linkId: link.id,
      input: {
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.75,
        accompanimentPrice: 4.99,
      },
    })

    expect(result).toMatchObject({
      salePrice: 4.99,
      brandId: brand.id,
      brandName: brand.name,
      unitCost: 2.5,
      estimatedCost: 1.875,
    })
    expect(scope.productsRepository.replace).toHaveBeenCalledWith(
      establishmentId,
      target.id,
      { accompanimentPrice: 4.99 },
    )
  })

  it('does not rewrite or invalidate inverse owners when the saved price is unchanged', async () => {
    const events: ProductSalesConfigurationChangedEvent[] = []
    scope.eventsRepository.add.mockImplementation(async (event) => {
      if (event instanceof ProductSalesConfigurationChangedEvent) events.push(event)
    })

    await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      linkId: link.id,
      input: {
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.75,
        accompanimentPrice: target.accompanimentPrice,
      },
    })

    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
    expect(scope.productAccompanimentsRepository.replace).toHaveBeenCalledOnce()
    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).not.toHaveBeenCalled()
    expect(events.map((event) => event.payload.productId)).toEqual([owner.id])
  })

  it('rejects invalid quantity, missing/foreign link or type, and operators without partial writes', async () => {
    const request = {
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      linkId: link.id,
      input: { accompanimentTypeId: type.id, quantityPerPortion: 1 },
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
    expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
    for (const accompanimentPrice of [-0.01, 1.234, Number.NaN, 10_000_000_000_000_000]) {
      await expect(
        useCase.execute({
          ...request,
          input: { ...request.input, quantityPerPortion: 1, accompanimentPrice },
        }),
      ).rejects.toBeInstanceOf(BadRequestError)
    }
    currentTarget = { ...target, accompanimentPrice: undefined }
    await expect(
      useCase.execute({
        ...request,
        input: { ...request.input, quantityPerPortion: 1 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    currentTarget = { ...target, accompanimentPrice: -1 }
    await expect(
      useCase.execute({
        ...request,
        input: { ...request.input, quantityPerPortion: 1 },
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    expect(scope.productsRepository.replace).not.toHaveBeenCalled()
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

  it('reports whether the edited individual row has links on other Portions', async () => {
    const request = {
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      linkId: link.id,
      input: { accompanimentTypeId: type.id, quantityPerPortion: 0.75, isGlobal: false },
    }

    await expect(useCase.execute(request)).resolves.toMatchObject({
      isGlobal: false,
      hasOtherPortionLinks: false,
    })
    expect(scope.productAccompanimentsRepository.replace).toHaveBeenCalledOnce()

    scope.productAccompanimentsRepository.countByAccompanimentProductId.mockResolvedValue(
      2,
    )
    await expect(useCase.execute(request)).resolves.toMatchObject({
      hasOtherPortionLinks: true,
    })
    expect(
      scope.productAccompanimentsRepository.countByAccompanimentProductId,
    ).toHaveBeenCalledWith(establishmentId, target.id)
  })

  describe('global accompaniments', () => {
    const actor = { id: 'manager-1', establishmentId, profile: UserProfile.Manager }
    const portionB = ProductFaker.fake({
      id: 'portion-2',
      establishmentId,
      categories: [ProductCategory.Portion],
    })
    const portionC = ProductFaker.fake({
      id: 'portion-3',
      establishmentId,
      categories: [ProductCategory.Portion],
      status: ProductStatus.Inactive,
    })
    const portionD = ProductFaker.fake({
      id: 'portion-4',
      establishmentId,
      categories: [ProductCategory.Portion],
    })
    const portions = [owner, portionB, portionC, portionD]
    const global = GlobalAccompanimentFaker.fake({
      id: 'global-1',
      establishmentId,
      accompanimentProductId: target.id,
      accompanimentTypeId: 'type-old',
      quantityPerPortion: 1,
    })
    const globalRow = (productId: string) =>
      ProductAccompanimentFaker.fake({
        id: `row-${productId}`,
        establishmentId,
        productId,
        accompanimentProductId: target.id,
        accompanimentTypeId: 'type-old',
        quantityPerPortion: 1,
        globalAccompanimentId: global.id,
      })
    const individualRow = (productId: string, quantityPerPortion: number) =>
      ProductAccompanimentFaker.fake({
        id: `row-${productId}`,
        establishmentId,
        productId,
        accompanimentProductId: target.id,
        accompanimentTypeId: 'type-other',
        quantityPerPortion,
      })
    const ownerGlobalRow = { ...globalRow(owner.id), id: link.id }
    const request = (
      input: {
        quantityPerPortion?: number
        accompanimentTypeId?: string
        accompanimentPrice?: number
        isGlobal?: boolean
      } = {},
    ) => ({
      actor,
      productId: owner.id,
      linkId: link.id,
      input: {
        accompanimentTypeId: 'type-old',
        quantityPerPortion: 1,
        ...input,
      },
    })
    const publishedProductIds = () =>
      scope.eventsRepository.add.mock.calls
        .map(([event]) =>
          event instanceof ProductSalesConfigurationChangedEvent
            ? event.payload.productId
            : undefined,
        )
        .sort()

    beforeEach(() => {
      scope.productsRepository.findById.mockImplementation(
        async (_, id) => portions.find((portion) => portion.id === id) ?? currentTarget,
      )
      scope.productsRepository.findManyByCategory.mockResolvedValue(portions)
      scope.accompanimentTypesRepository.findById.mockImplementation(async (_, id) =>
        AccompanimentTypeFaker.fake({ id, establishmentId, name: id }),
      )
      scope.productAccompanimentsRepository.findById.mockResolvedValue(ownerGlobalRow)
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        portions.map((portion) => globalRow(portion.id)),
      )
      scope.globalAccompanimentsRepository.add.mockImplementation(async (input) => ({
        ...global,
        ...input,
      }))
      scope.productAccompanimentsRepository.addMany.mockResolvedValue([])
    })

    it('changes the shared values for the global and every Portion row', async () => {
      const result = await useCase.execute(
        request({
          accompanimentTypeId: type.id,
          quantityPerPortion: 0.75,
          accompanimentPrice: 5,
        }),
      )

      const changes = { accompanimentTypeId: type.id, quantityPerPortion: 0.75 }
      expect(result).toMatchObject({
        id: link.id,
        isGlobal: true,
        hasOtherPortionLinks: false,
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.75,
        salePrice: 5,
      })
      expect(scope.globalAccompanimentsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        global.id,
        changes,
      )
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, global.id, changes)
      expect(scope.productsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        target.id,
        { accompanimentPrice: 5 },
      )
      expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(publishedProductIds()).toEqual(portions.map((portion) => portion.id))
    })

    it('shares a type-only or quantity-only change', async () => {
      await useCase.execute(request({ quantityPerPortion: 2 }))
      expect(scope.globalAccompanimentsRepository.replace).toHaveBeenLastCalledWith(
        establishmentId,
        global.id,
        { accompanimentTypeId: 'type-old', quantityPerPortion: 2 },
      )

      await useCase.execute(request({ accompanimentTypeId: type.id }))
      expect(scope.globalAccompanimentsRepository.replace).toHaveBeenLastCalledWith(
        establishmentId,
        global.id,
        { accompanimentTypeId: type.id, quantityPerPortion: 1 },
      )
    })

    it('rejects ending the global status and changes nothing', async () => {
      await expect(
        useCase.execute(request({ quantityPerPortion: 2, isGlobal: false })),
      ).rejects.toThrow(
        new BadRequestError(
          'Um acompanhamento global só deixa de ser global pela remoção de todas as porções.',
        ),
      )

      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(scope.globalAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })

    it('writes and publishes nothing when a global edit changes nothing', async () => {
      for (const isGlobal of [undefined, true]) {
        await expect(useCase.execute(request({ isGlobal }))).resolves.toMatchObject({
          id: link.id,
          isGlobal: true,
        })
      }
      await useCase.execute(request({ accompanimentPrice: target.accompanimentPrice }))

      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(scope.globalAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.replaceManyByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })

    it('republishes every Portion when only the shared price changes', async () => {
      await useCase.execute(request({ accompanimentPrice: 9 }))

      expect(scope.productsRepository.replace).toHaveBeenCalledWith(
        establishmentId,
        target.id,
        { accompanimentPrice: 9 },
      )
      expect(scope.globalAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(publishedProductIds()).toEqual(portions.map((portion) => portion.id))
    })

    it('rejects an invalid shared price or type before writing the global', async () => {
      await expect(
        useCase.execute(request({ quantityPerPortion: 2, accompanimentPrice: -1 })),
      ).rejects.toBeInstanceOf(BadRequestError)
      scope.accompanimentTypesRepository.findById.mockResolvedValue(undefined)
      await expect(
        useCase.execute(request({ quantityPerPortion: 2 })),
      ).rejects.toBeInstanceOf(NotFoundError)

      expect(scope.productsRepository.replace).not.toHaveBeenCalled()
      expect(scope.globalAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })

    it('converts an individual row in place with the edited values and fills the other Portions', async () => {
      const individual = individualRow(owner.id, 3)
      scope.productAccompanimentsRepository.findById.mockResolvedValue({
        ...individual,
        id: link.id,
      })
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId
        .mockResolvedValueOnce([
          { ...individual, id: link.id },
          individualRow(portionB.id, 2),
        ])
        .mockResolvedValue(portions.map((portion) => globalRow(portion.id)))

      const result = await useCase.execute(
        request({
          accompanimentTypeId: type.id,
          quantityPerPortion: 0.5,
          isGlobal: true,
        }),
      )

      expect(result).toMatchObject({
        id: link.id,
        isGlobal: true,
        hasOtherPortionLinks: false,
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.5,
      })
      expect(scope.globalAccompanimentsRepository.add).toHaveBeenCalledWith({
        establishmentId,
        accompanimentProductId: target.id,
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.5,
      })
      expect(
        scope.productAccompanimentsRepository.replaceManyByAccompanimentProductId,
      ).toHaveBeenCalledWith(establishmentId, target.id, {
        accompanimentTypeId: type.id,
        quantityPerPortion: 0.5,
        globalAccompanimentId: global.id,
      })
      expect(scope.productAccompanimentsRepository.addMany).toHaveBeenCalledWith(
        [portionC, portionD].map((portion) => ({
          establishmentId,
          productId: portion.id,
          accompanimentProductId: target.id,
          accompanimentTypeId: type.id,
          quantityPerPortion: 0.5,
          globalAccompanimentId: global.id,
        })),
      )
      expect(scope.productAccompanimentsRepository.replace).not.toHaveBeenCalled()
      expect(scope.productAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(publishedProductIds()).toEqual(portions.map((portion) => portion.id))
    })

    it('validates a conversion like an edit before creating the global', async () => {
      scope.productAccompanimentsRepository.findById.mockResolvedValue(link)
      currentTarget = { ...target, status: ProductStatus.Inactive }

      await expect(useCase.execute(request({ isGlobal: true }))).rejects.toBeInstanceOf(
        BadRequestError,
      )

      expect(scope.globalAccompanimentsRepository.add).not.toHaveBeenCalled()
      expect(scope.productAccompanimentsRepository.addMany).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })

    it('publishes nothing when persisting the converted rows fails', async () => {
      scope.productAccompanimentsRepository.findById.mockResolvedValue(link)
      scope.productAccompanimentsRepository.addMany.mockRejectedValue(new Error('failed'))

      await expect(useCase.execute(request({ isGlobal: true }))).rejects.toThrow('failed')

      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })
  })
})
