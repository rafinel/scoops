import { describe, expect, it } from 'vitest'
import { AccountFaker } from '#identity/domain/entities/fakers/index.ts'
import type { GlobalSearchHit } from '#identity/domain/structures/global-search-hit.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { IdentityGlobalSearchProvider } from '#identity/interfaces/identity-global-search-provider.ts'
import type { MrpGlobalSearchProvider } from '#identity/interfaces/mrp-global-search-provider.ts'
import type { PdvGlobalSearchProvider } from '#identity/interfaces/pdv-global-search-provider.ts'
import { SearchGlobalUseCase } from '#identity/use-cases/search-global-use-case.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import { mock } from 'vitest-mock-extended'

function createSearchGlobalUseCase() {
  const identityProvider = mock<IdentityGlobalSearchProvider>()
  const mrpProvider = mock<MrpGlobalSearchProvider>()
  const pdvProvider = mock<PdvGlobalSearchProvider>()

  identityProvider.searchUsers.mockResolvedValue([])
  mrpProvider.searchProducts.mockResolvedValue([])
  pdvProvider.searchOrders.mockResolvedValue([])
  pdvProvider.searchSalesChannels.mockResolvedValue([])
  pdvProvider.searchDiscounts.mockResolvedValue([])

  return {
    identityProvider,
    mrpProvider,
    pdvProvider,
    useCase: new SearchGlobalUseCase(identityProvider, mrpProvider, pdvProvider),
  }
}

function createSearchInput(actor: ReturnType<typeof AccountFaker.fake>, query: string) {
  return {
    establishmentId: actor.establishmentId,
    currentUserId: actor.id,
    query,
    limit: 5,
  }
}

describe('Search Global Use Case', () => {
  it('returns grouped Manager results with scoped provider input and stable caps', async () => {
    const { identityProvider, mrpProvider, pdvProvider, useCase } =
      createSearchGlobalUseCase()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const userHits: GlobalSearchHit[] = [
      {
        kind: 'user',
        userId: actor.id,
        label: 'Manager',
        context: 'Manager',
        status: 'Active',
      },
      ...Array.from({ length: 6 }, (_, index) => ({
        kind: 'user' as const,
        userId: `user-${index + 1}`,
        label: `User ${index + 1}`,
        context: 'Operator',
        status: 'Active',
      })),
    ]
    const productHits: GlobalSearchHit[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'product',
      productId: `product-${index + 1}`,
      label: `Product ${index + 1}`,
      status: 'Available',
    }))
    const orderHits: GlobalSearchHit[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'order',
      orderId: `order-${index + 1}`,
      label: `Order ${index + 1}`,
      context: 'Vanilla cone',
      status: 'Open',
    }))
    const channelHits: GlobalSearchHit[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'salesChannel',
      salesChannelId: `channel-${index + 1}`,
      label: `Channel ${index + 1}`,
      status: 'Active',
    }))
    const discountHits: GlobalSearchHit[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'discount',
      discountId: `discount-${index + 1}`,
      label: `Discount ${index + 1}`,
      status: 'Active',
    }))
    identityProvider.searchUsers.mockResolvedValue(userHits)
    mrpProvider.searchProducts.mockResolvedValue(productHits)
    pdvProvider.searchOrders.mockResolvedValue(orderHits)
    pdvProvider.searchSalesChannels.mockResolvedValue(channelHits)
    pdvProvider.searchDiscounts.mockResolvedValue(discountHits)

    const result = await useCase.execute({ actor, query: '  venda  ' })
    const providerInput = createSearchInput(actor, 'venda')

    expect(result.pages).toEqual([
      { kind: 'page', pageKey: 'newSale', label: 'Nova venda' },
      { kind: 'page', pageKey: 'salesChannels', label: 'Canais de venda' },
    ])
    expect(result.products).toEqual(productHits.slice(0, 5))
    expect(result.orders).toEqual(orderHits.slice(0, 5))
    expect(result.users).toEqual(userHits.slice(1, 6))
    expect(result.salesChannels).toEqual(channelHits.slice(0, 5))
    expect(result.discounts).toEqual(discountHits.slice(0, 5))
    expect(identityProvider.searchUsers).toHaveBeenCalledWith(providerInput)
    expect(mrpProvider.searchProducts).toHaveBeenCalledWith(providerInput)
    expect(pdvProvider.searchOrders).toHaveBeenCalledWith(providerInput)
    expect(pdvProvider.searchSalesChannels).toHaveBeenCalledWith(providerInput)
    expect(pdvProvider.searchDiscounts).toHaveBeenCalledWith(providerInput)
  })

  it('returns only the permitted page and record groups for Operators', async () => {
    const { identityProvider, mrpProvider, pdvProvider, useCase } =
      createSearchGlobalUseCase()
    const actor = AccountFaker.fake({ profile: UserProfile.Operator })
    const orderHits: GlobalSearchHit[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'order',
      orderId: `order-${index + 1}`,
      label: `Order ${index + 1}`,
      context: 'Vanilla cone',
      status: 'Open',
    }))
    const productHits: GlobalSearchHit[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'product',
      productId: `product-${index + 1}`,
      label: `Product ${index + 1}`,
      status: 'Available',
    }))
    const channelHits: GlobalSearchHit[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'salesChannel',
      salesChannelId: `channel-${index + 1}`,
      label: `Channel ${index + 1}`,
      status: 'Active',
    }))
    const discountHits: GlobalSearchHit[] = Array.from({ length: 6 }, (_, index) => ({
      kind: 'discount',
      discountId: `discount-${index + 1}`,
      label: `Discount ${index + 1}`,
      status: 'Active',
    }))
    pdvProvider.searchOrders.mockResolvedValue(orderHits)
    mrpProvider.searchProducts.mockResolvedValue(productHits)
    pdvProvider.searchSalesChannels.mockResolvedValue(channelHits)
    pdvProvider.searchDiscounts.mockResolvedValue(discountHits)

    const result = await useCase.execute({ actor, query: 'o' })
    const channelPageResult = await useCase.execute({ actor, query: 'canais' })

    expect(result).toEqual({
      pages: [
        { kind: 'page', pageKey: 'newSale', label: 'Nova venda' },
        { kind: 'page', pageKey: 'orders', label: 'Pedidos' },
        { kind: 'page', pageKey: 'products', label: 'Produtos' },
        { kind: 'page', pageKey: 'discounts', label: 'Descontos' },
      ],
      products: productHits.slice(0, 5),
      orders: orderHits.slice(0, 5),
      users: [],
      salesChannels: channelHits.slice(0, 5),
      discounts: discountHits.slice(0, 5),
    })
    expect(channelPageResult.pages).toEqual([
      { kind: 'page', pageKey: 'salesChannels', label: 'Canais de venda' },
    ])
    expect(mrpProvider.searchProducts).toHaveBeenCalledWith(createSearchInput(actor, 'o'))
    expect(pdvProvider.searchOrders).toHaveBeenCalledWith(createSearchInput(actor, 'o'))
    expect(pdvProvider.searchSalesChannels).toHaveBeenCalledWith(
      createSearchInput(actor, 'o'),
    )
    expect(pdvProvider.searchDiscounts).toHaveBeenCalledWith(
      createSearchInput(actor, 'o'),
    )
    expect(identityProvider.searchUsers).not.toHaveBeenCalled()
  })

  it('passes exact order queries to the scoped PDV provider and preserves snapshot context', async () => {
    const { mrpProvider, pdvProvider, useCase } = createSearchGlobalUseCase()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    const historicalOrder: GlobalSearchHit = {
      kind: 'order',
      orderId: 'order-42',
      label: 'Order #42',
      context: 'Vanilla cone',
      status: 'Complete',
    }
    pdvProvider.searchOrders.mockResolvedValue([historicalOrder])
    mrpProvider.searchProducts.mockResolvedValue([
      {
        kind: 'product',
        productId: 'current-product',
        label: 'Chocolate cone',
        status: 'Available',
      },
    ])

    const numericResult = await useCase.execute({ actor, query: '#42' })
    const textResult = await useCase.execute({ actor, query: 'Vanilla' })

    expect(pdvProvider.searchOrders).toHaveBeenNthCalledWith(
      1,
      createSearchInput(actor, '#42'),
    )
    expect(pdvProvider.searchOrders).toHaveBeenNthCalledWith(
      2,
      createSearchInput(actor, 'Vanilla'),
    )
    expect(numericResult.orders).toEqual([historicalOrder])
    expect(textResult.orders).toEqual([historicalOrder])
    expect(textResult.products).toEqual([
      {
        kind: 'product',
        productId: 'current-product',
        label: 'Chocolate cone',
        status: 'Available',
      },
    ])
  })

  it('rejects unsupported profiles before invoking providers', async () => {
    const { identityProvider, mrpProvider, pdvProvider, useCase } =
      createSearchGlobalUseCase()
    const actor = AccountFaker.fake({ profile: 'pending' as never })

    await expect(useCase.execute({ actor, query: 'orders' })).rejects.toBeInstanceOf(
      AuthorizationError,
    )
    expect(identityProvider.searchUsers).not.toHaveBeenCalled()
    expect(mrpProvider.searchProducts).not.toHaveBeenCalled()
    expect(pdvProvider.searchOrders).not.toHaveBeenCalled()
  })

  it('rejects the whole search when any invoked provider fails', async () => {
    const { identityProvider, mrpProvider, pdvProvider, useCase } =
      createSearchGlobalUseCase()
    const actor = AccountFaker.fake({ profile: UserProfile.Manager })
    pdvProvider.searchSalesChannels.mockRejectedValue(new Error('Provider failed'))

    await expect(useCase.execute({ actor, query: 'orders' })).rejects.toThrow(
      'Provider failed',
    )
    expect(identityProvider.searchUsers).toHaveBeenCalledOnce()
    expect(mrpProvider.searchProducts).toHaveBeenCalledOnce()
    expect(pdvProvider.searchOrders).toHaveBeenCalledOnce()
    expect(pdvProvider.searchSalesChannels).toHaveBeenCalledOnce()
    expect(pdvProvider.searchDiscounts).toHaveBeenCalledOnce()
  })
})
