import { beforeEach, describe, expect, it } from 'vitest'
import { mock, mockDeep, type DeepMockProxy, type MockProxy } from 'vitest-mock-extended'

import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import {
  GlobalAccompanimentFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '#mrp/domain/entities/fakers/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationSourceFaker } from '#mrp/domain/structures/fakers/index.ts'
import {
  AccompanimentRemovalScope,
  ProductCategory,
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
import { RemoveProductAccompanimentUseCase } from '#mrp/use-cases/remove-product-accompaniment-use-case.ts'

const establishmentId = 'establishment-1'
const owner = ProductFaker.fake({
  id: 'portion-1',
  establishmentId,
  categories: [ProductCategory.Portion],
})
const link = ProductAccompanimentFaker.fake({
  id: 'link-1',
  establishmentId,
  productId: owner.id,
})

describe('Remove Product Accompaniment Use Case', () => {
  let database: MockProxy<MrpDatabase>
  let scope: DeepMockProxy<MrpDatabaseRepositories>
  let useCase: RemoveProductAccompanimentUseCase

  beforeEach(() => {
    database = mock<MrpDatabase>()
    scope = mockDeep<MrpDatabaseRepositories>()
    database.run.mockImplementation(async (operation) => operation(scope))
    scope.productsRepository.findById.mockResolvedValue(owner)
    scope.productAccompanimentsRepository.findById.mockResolvedValue(link)
    scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockImplementation(
      async (_, productIds) =>
        productIds.includes(owner.id)
          ? [ProductSalesConfigurationSourceFaker.fake({ product: owner })]
          : [],
    )
    useCase = new RemoveProductAccompanimentUseCase(database)
  })

  it('removes only the tenant-qualified relationship', async () => {
    await useCase.execute({
      actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
      productId: owner.id,
      linkId: link.id,
    })
    expect(scope.productAccompanimentsRepository.remove).toHaveBeenCalledWith(
      establishmentId,
      owner.id,
      link.id,
    )
    expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
    expect(scope.stockTransactionsRepository.add).not.toHaveBeenCalled()
    expect(
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
    ).toHaveBeenCalledExactlyOnceWith(establishmentId, [owner.id])
    expect(
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId,
    ).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).toHaveBeenCalledExactlyOnceWith(
      new ProductSalesConfigurationChangedEvent({
        establishmentId,
        productId: owner.id,
        state: 'available',
        configuration: {
          establishmentId,
          productId: owner.id,
          name: owner.name,
          categories: [ProductCategory.Portion],
          status: owner.status,
          stockControl: owner.stockControl,
          sizes: [],
          resaleConfigurations: [],
          updatedAt: owner.updatedAt,
        },
      }),
    )
  })

  it('rejects missing/invalid owner, link and operator without deleting', async () => {
    scope.productsRepository.findById.mockResolvedValue({
      ...owner,
      categories: [ProductCategory.Ingredient],
    })
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        linkId: link.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestError)
    scope.productsRepository.findById.mockResolvedValue(owner)
    scope.productAccompanimentsRepository.findById.mockResolvedValue(undefined)
    await expect(
      useCase.execute({
        actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
        productId: owner.id,
        linkId: link.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
    expect(scope.productAccompanimentsRepository.remove).not.toHaveBeenCalled()
    await expect(
      useCase.execute({
        actor: { id: 'operator-1', establishmentId, profile: UserProfile.Operator },
        productId: owner.id,
        linkId: link.id,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('hides links from another establishment or Portion without deleting', async () => {
    for (const returnedLink of [
      { ...link, establishmentId: 'another-establishment' },
      { ...link, productId: 'another-portion' },
    ]) {
      scope.productAccompanimentsRepository.findById.mockResolvedValue(returnedLink)
      await expect(
        useCase.execute({
          actor: { id: 'manager-1', establishmentId, profile: UserProfile.Manager },
          productId: owner.id,
          linkId: link.id,
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
    }
    expect(scope.productAccompanimentsRepository.remove).not.toHaveBeenCalled()
    expect(scope.eventsRepository.add).not.toHaveBeenCalled()
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
    })
    const portions = [owner, portionB, portionC]
    const global = GlobalAccompanimentFaker.fake({ id: 'global-1', establishmentId })
    const globalRow = (productId: string) =>
      ProductAccompanimentFaker.fake({
        id: `row-${productId}`,
        establishmentId,
        productId,
        accompanimentProductId: global.accompanimentProductId,
        globalAccompanimentId: global.id,
      })
    const ownerRow = { ...globalRow(owner.id), id: link.id }
    const publishedProductIds = () =>
      scope.eventsRepository.add.mock.calls
        .map(([event]) =>
          event instanceof ProductSalesConfigurationChangedEvent
            ? event.payload.productId
            : undefined,
        )
        .sort()

    beforeEach(() => {
      scope.productsRepository.findById.mockImplementation(async (_, id) =>
        portions.find((portion) => portion.id === id),
      )
      scope.productSalesConfigurationSourcesRepository.findManyByProductIds.mockImplementation(
        async (_, productIds) =>
          productIds.flatMap((productId) => {
            const portion = portions.find((candidate) => candidate.id === productId)
            return portion
              ? [ProductSalesConfigurationSourceFaker.fake({ product: portion })]
              : []
          }),
      )
      scope.productAccompanimentsRepository.findById.mockResolvedValue(ownerRow)
      scope.productAccompanimentsRepository.findManyByAccompanimentProductId.mockResolvedValue(
        [ownerRow, globalRow(portionB.id)],
      )
    })

    it.each([
      ['an omitted scope', undefined],
      ['the Portion scope', AccompanimentRemovalScope.Portion],
    ])('removes only this Portion row with %s', async (_, removalScope) => {
      await useCase.execute({
        actor,
        productId: owner.id,
        linkId: link.id,
        scope: removalScope,
      })

      expect(scope.productAccompanimentsRepository.remove).toHaveBeenCalledWith(
        establishmentId,
        owner.id,
        link.id,
      )
      expect(
        scope.productAccompanimentsRepository.removeByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.globalAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(publishedProductIds()).toEqual([owner.id])
    })

    it('removes every row and then the global with the All scope and republishes each Portion', async () => {
      await useCase.execute({
        actor,
        productId: owner.id,
        linkId: link.id,
        scope: AccompanimentRemovalScope.All,
      })

      expect(
        scope.productAccompanimentsRepository.removeByGlobalAccompanimentId,
      ).toHaveBeenCalledWith(establishmentId, global.id)
      expect(scope.globalAccompanimentsRepository.remove).toHaveBeenCalledWith(
        establishmentId,
        global.id,
      )
      expect(scope.productAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.removeByGlobalAccompanimentId.mock
          .invocationCallOrder[0],
      ).toBeLessThan(
        scope.globalAccompanimentsRepository.remove.mock.invocationCallOrder[0],
      )
      expect(publishedProductIds()).toEqual([owner.id, portionB.id])
      expect(
        scope.productSalesConfigurationSourcesRepository.findManyByProductIds,
      ).toHaveBeenCalledExactlyOnceWith(establishmentId, [owner.id, portionB.id])
      expect(scope.stockBalancesRepository.add).not.toHaveBeenCalled()
      expect(scope.stockTransactionsRepository.add).not.toHaveBeenCalled()
    })

    it('does not delete the global when removing its rows fails', async () => {
      scope.productAccompanimentsRepository.removeByGlobalAccompanimentId.mockRejectedValue(
        new Error('failed'),
      )

      await expect(
        useCase.execute({
          actor,
          productId: owner.id,
          linkId: link.id,
          scope: AccompanimentRemovalScope.All,
        }),
      ).rejects.toThrow('failed')

      expect(scope.globalAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })

    it('rejects removing an individual row from all Portions', async () => {
      scope.productAccompanimentsRepository.findById.mockResolvedValue(link)

      await expect(
        useCase.execute({
          actor,
          productId: owner.id,
          linkId: link.id,
          scope: AccompanimentRemovalScope.All,
        }),
      ).rejects.toThrow(
        new BadRequestError(
          'Somente acompanhamentos globais podem ser removidos de todas as porções.',
        ),
      )

      expect(scope.productAccompanimentsRepository.remove).not.toHaveBeenCalled()
      expect(
        scope.productAccompanimentsRepository.removeByGlobalAccompanimentId,
      ).not.toHaveBeenCalled()
      expect(scope.eventsRepository.add).not.toHaveBeenCalled()
    })

    it('removes an individual row with the Portion scope', async () => {
      scope.productAccompanimentsRepository.findById.mockResolvedValue(link)

      await useCase.execute({
        actor,
        productId: owner.id,
        linkId: link.id,
        scope: AccompanimentRemovalScope.Portion,
      })

      expect(scope.productAccompanimentsRepository.remove).toHaveBeenCalledWith(
        establishmentId,
        owner.id,
        link.id,
      )
    })
  })
})
