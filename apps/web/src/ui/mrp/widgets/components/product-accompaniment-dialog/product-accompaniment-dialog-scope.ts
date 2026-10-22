import type {
  GlobalAccompanimentDetails,
  ProductAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

export type ProductAccompanimentDialogMode =
  | 'portion'
  | 'portion-row'
  | 'global'
  | 'make-global'

export type ProductAccompanimentDialogScope =
  | { kind: 'portion' }
  | { kind: 'portion-row'; portionName: string }
  | { kind: 'global'; accompaniment: GlobalAccompanimentDetails }
  | {
      kind: 'make-global'
      accompaniment: GlobalAccompanimentDetails
      hasIndividualLinks: boolean
    }

export const PORTION_SIDE_SCOPE: ProductAccompanimentDialogScope = { kind: 'portion' }

export type ProductAccompanimentScopeInput = {
  accompaniment?: GlobalAccompanimentDetails
  hasIndividualLinks?: boolean
  mode?: ProductAccompanimentDialogMode
  portionName?: string
}

export function buildProductAccompanimentScope({
  accompaniment,
  hasIndividualLinks = false,
  mode = 'portion',
  portionName = '',
}: ProductAccompanimentScopeInput): ProductAccompanimentDialogScope {
  if (mode === 'portion-row') return { kind: 'portion-row', portionName }
  if (mode === 'global' && accompaniment) return { kind: 'global', accompaniment }
  if (mode === 'make-global' && accompaniment) {
    return { kind: 'make-global', accompaniment, hasIndividualLinks }
  }
  return PORTION_SIDE_SCOPE
}

export function isAccompanimentSideScope(
  scope: ProductAccompanimentDialogScope,
): scope is Extract<ProductAccompanimentDialogScope, { kind: 'global' | 'make-global' }> {
  return scope.kind === 'global' || scope.kind === 'make-global'
}

type SelectedCandidatePrice = { accompanimentPrice: number | null; isGlobal: boolean }

// The sale price the dialog edits: the item's own price (the link's, or the global's for a
// global row), the global's shared price, or the shared price of a global candidate picked
// for a new link. Undefined when nothing owns a price yet, so a new individual link or a new
// global starts from the Accompaniment's default price or the Resale proposal.
export function getOwnSalePrice(
  item: ProductAccompanimentDetails | undefined,
  scope: ProductAccompanimentDialogScope,
  selectedCandidate?: SelectedCandidatePrice,
): number | null | undefined {
  if (item) return item.salePrice
  if (scope.kind === 'global') return scope.accompaniment.salePrice
  return selectedCandidate?.isGlobal ? selectedCandidate.accompanimentPrice : undefined
}

// The price an entered value is compared with before it is sent: the edited link's or
// global's own price, else the Accompaniment's default price (a new link or a new global).
export function getBaselinePrice(
  item: ProductAccompanimentDetails | undefined,
  scope: ProductAccompanimentDialogScope,
  defaultPrice: number | null,
  selectedCandidate?: SelectedCandidatePrice,
) {
  const ownPrice = getOwnSalePrice(item, scope, selectedCandidate)
  return ownPrice === undefined ? defaultPrice : ownPrice
}
