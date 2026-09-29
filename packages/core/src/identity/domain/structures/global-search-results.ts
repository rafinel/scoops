import type { GlobalSearchHit } from '#identity/domain/structures/global-search-hit.ts'

export type GlobalSearchResults = {
  pages: Extract<GlobalSearchHit, { kind: 'page' }>[]
  products: Extract<GlobalSearchHit, { kind: 'product' }>[]
  orders: Extract<GlobalSearchHit, { kind: 'order' }>[]
  users: Extract<GlobalSearchHit, { kind: 'user' }>[]
  salesChannels: Extract<GlobalSearchHit, { kind: 'salesChannel' }>[]
  discounts: Extract<GlobalSearchHit, { kind: 'discount' }>[]
}
