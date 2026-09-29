import type { GlobalSearchPageKey } from '#identity/domain/structures/global-search-page-key.ts'

export type GlobalSearchHit =
  | { kind: 'page'; pageKey: GlobalSearchPageKey; label: string }
  | { kind: 'product'; productId: string; label: string; status?: string }
  | {
      kind: 'order'
      orderId: string
      label: string
      context: string
      status: string
    }
  | {
      kind: 'user'
      userId: string
      label: string
      context: string
      status: string
    }
  | {
      kind: 'salesChannel'
      salesChannelId: string
      label: string
      status: string
    }
  | {
      kind: 'discount'
      discountId: string
      label: string
      status: string
    }
