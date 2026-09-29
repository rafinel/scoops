import type { Account } from '#identity/domain/entities/account.ts'
import type { GlobalSearchHit } from '#identity/domain/structures/global-search-hit.ts'
import type { GlobalSearchPageKey } from '#identity/domain/structures/global-search-page-key.ts'
import type { GlobalSearchProviderInput } from '#identity/domain/structures/global-search-provider-input.ts'
import type { GlobalSearchResults } from '#identity/domain/structures/global-search-results.ts'
import type { IdentityGlobalSearchProvider } from '#identity/interfaces/identity-global-search-provider.ts'
import type { MrpGlobalSearchProvider } from '#identity/interfaces/mrp-global-search-provider.ts'
import type { PdvGlobalSearchProvider } from '#identity/interfaces/pdv-global-search-provider.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { AuthorizationError } from '#shared/domain/errors/authorization-error.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  actor: Account
  query: string
}

type RecordSearchResults = {
  orders: GlobalSearchHit[]
  products: GlobalSearchHit[]
  users: GlobalSearchHit[]
  salesChannels: GlobalSearchHit[]
  discounts: GlobalSearchHit[]
}

type ProviderSearchRequests = readonly [
  Promise<GlobalSearchHit[]>,
  Promise<GlobalSearchHit[]>,
  Promise<GlobalSearchHit[]>,
  Promise<GlobalSearchHit[]>,
  Promise<GlobalSearchHit[]>,
]

type ProviderSearchResults = [
  GlobalSearchHit[],
  GlobalSearchHit[],
  GlobalSearchHit[],
  GlobalSearchHit[],
  GlobalSearchHit[],
]

const RESULT_LIMIT = 5

const MANAGER_PAGES: readonly {
  pageKey: GlobalSearchPageKey
  label: string
}[] = [
  { pageKey: 'dashboard', label: 'Dashboard' },
  { pageKey: 'products', label: 'Produtos' },
  { pageKey: 'newSale', label: 'Nova venda' },
  { pageKey: 'orders', label: 'Pedidos' },
  { pageKey: 'salesChannels', label: 'Canais de venda' },
  { pageKey: 'discounts', label: 'Descontos' },
  { pageKey: 'users', label: 'Usuários' },
  { pageKey: 'shopSettings', label: 'Sorveteria' },
  { pageKey: 'subscription', label: 'Assinatura' },
  { pageKey: 'account', label: 'Minha conta' },
  { pageKey: 'accompanimentTypes', label: 'Tipos de acompanhamento' },
]

const OPERATOR_PAGES: readonly {
  pageKey: GlobalSearchPageKey
  label: string
}[] = [
  { pageKey: 'newSale', label: 'Nova venda' },
  { pageKey: 'orders', label: 'Pedidos' },
  { pageKey: 'products', label: 'Produtos' },
  { pageKey: 'salesChannels', label: 'Canais de venda' },
  { pageKey: 'discounts', label: 'Descontos' },
]

export class SearchGlobalUseCase implements UseCase<Request, GlobalSearchResults> {
  constructor(
    private readonly identityProvider: IdentityGlobalSearchProvider,
    private readonly mrpProvider: MrpGlobalSearchProvider,
    private readonly pdvProvider: PdvGlobalSearchProvider,
  ) {}

  async execute({ actor, query }: Request): Promise<GlobalSearchResults> {
    this.ensureCanSearch(actor)
    return this.search(actor, query)
  }

  private async search(actor: Account, query: string): Promise<GlobalSearchResults> {
    const { providerInput, pages } = this.createSearchContext(actor, query)
    const recordHits = await this.searchRecords(actor, providerInput)

    return this.buildResults(actor.id, pages, recordHits)
  }

  private createSearchContext(actor: Account, query: string) {
    const providerInput = this.createProviderInput(actor, query)

    return {
      providerInput,
      pages: this.getPages(actor.profile, providerInput.query),
    }
  }

  private ensureCanSearch(actor: Account): void {
    if (actor.profile !== UserProfile.Manager && actor.profile !== UserProfile.Operator) {
      throw new AuthorizationError('É necessário ter acesso ao sistema.')
    }
  }

  private createProviderInput(actor: Account, query: string): GlobalSearchProviderInput {
    return {
      establishmentId: actor.establishmentId,
      currentUserId: actor.id,
      query: query.trim(),
      limit: RESULT_LIMIT,
    }
  }

  private async searchRecords(
    actor: Account,
    providerInput: GlobalSearchProviderInput,
  ): Promise<RecordSearchResults> {
    const requests = this.createProviderRequests(
      providerInput,
      this.searchUsers(actor, providerInput),
    )
    const results = await Promise.all(requests)

    return this.mapProviderResults(results)
  }

  private createProviderRequests(
    providerInput: GlobalSearchProviderInput,
    userSearch: Promise<GlobalSearchHit[]>,
  ): ProviderSearchRequests {
    return [
      this.pdvProvider.searchOrders(providerInput),
      this.mrpProvider.searchProducts(providerInput),
      userSearch,
      this.pdvProvider.searchSalesChannels(providerInput),
      this.pdvProvider.searchDiscounts(providerInput),
    ] as const
  }

  private mapProviderResults([
    orders,
    products,
    users,
    salesChannels,
    discounts,
  ]: ProviderSearchResults): RecordSearchResults {
    return { orders, products, users, salesChannels, discounts }
  }

  private searchUsers(
    actor: Account,
    providerInput: GlobalSearchProviderInput,
  ): Promise<GlobalSearchHit[]> {
    return actor.profile === UserProfile.Manager
      ? this.identityProvider.searchUsers(providerInput)
      : Promise.resolve([])
  }

  private buildResults(
    currentUserId: string,
    pages: Extract<GlobalSearchHit, { kind: 'page' }>[],
    recordHits: RecordSearchResults,
  ): GlobalSearchResults {
    return {
      pages,
      ...this.buildProductAndOrderGroups(recordHits),
      users: this.takeUserHits(recordHits.users, currentUserId),
      ...this.buildChannelAndDiscountGroups(recordHits),
    }
  }

  private buildProductAndOrderGroups(recordHits: RecordSearchResults) {
    return {
      products: this.takeHits(recordHits.products, 'product'),
      orders: this.takeHits(recordHits.orders, 'order'),
    }
  }

  private buildChannelAndDiscountGroups(recordHits: RecordSearchResults) {
    return {
      salesChannels: this.takeHits(recordHits.salesChannels, 'salesChannel'),
      discounts: this.takeHits(recordHits.discounts, 'discount'),
    }
  }

  private getPages(
    profile: Account['profile'],
    query: string,
  ): Extract<GlobalSearchHit, { kind: 'page' }>[] {
    const pages = profile === UserProfile.Manager ? MANAGER_PAGES : OPERATOR_PAGES
    const normalizedQuery = query.toLowerCase()

    return pages
      .filter(({ label }) => label.toLowerCase().includes(normalizedQuery))
      .map(({ pageKey, label }) => ({ kind: 'page', pageKey, label }))
  }

  private takeHits<Kind extends GlobalSearchHit['kind']>(
    hits: GlobalSearchHit[],
    kind: Kind,
  ): Extract<GlobalSearchHit, { kind: Kind }>[] {
    return hits
      .filter((hit): hit is Extract<GlobalSearchHit, { kind: Kind }> => hit.kind === kind)
      .slice(0, RESULT_LIMIT)
  }

  private takeUserHits(
    hits: GlobalSearchHit[],
    currentUserId: string,
  ): Extract<GlobalSearchHit, { kind: 'user' }>[] {
    return hits
      .filter(
        (hit): hit is Extract<GlobalSearchHit, { kind: 'user' }> =>
          hit.kind === 'user' && hit.userId !== currentUserId,
      )
      .slice(0, RESULT_LIMIT)
  }
}
