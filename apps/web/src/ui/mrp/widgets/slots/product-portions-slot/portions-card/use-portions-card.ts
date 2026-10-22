import { useId, useRef } from 'react'

import type {
  AccompanimentPortionsPage,
  GlobalAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import type { PortionsEmptyStateVariant } from '../portions-empty-state'

const INDIVIDUAL_SUBTITLE =
  'Porções que oferecem este acompanhamento no PDV. Cada vínculo tem o seu preço.'
const INDIVIDUAL_EMPTY_SUBTITLE = 'Porções que oferecem este acompanhamento no PDV.'
const GLOBAL_SUBTITLE =
  'Este acompanhamento é global e aparece em todas as porções. Tipo, quantidade e preço são compartilhados.'

export type PortionsCardBody = 'table' | PortionsEmptyStateVariant

export type UsePortionsCardProps = {
  canManage: boolean
  globalAccompaniment: GlobalAccompanimentDetails
  handleSearchChange: (search: string) => void
  isActive: boolean
  isSearching: boolean
  linkedCount: number
  portionsPage: AccompanimentPortionsPage
  searchInput: string
}

export function usePortionsCard(props: UsePortionsCardProps) {
  const inactiveNoticeId = useId()
  const searchInputRef = useRef<HTMLInputElement>(null)

  function handleClearSearch() {
    props.handleSearchChange('')
    searchInputRef.current?.focus()
  }

  return { ...getCardState(props), inactiveNoticeId, searchInputRef, handleClearSearch }
}

function getCardState({
  canManage,
  globalAccompaniment,
  isActive,
  isSearching,
  linkedCount,
  portionsPage,
  searchInput,
}: UsePortionsCardProps) {
  const isGlobal = globalAccompaniment.isGlobal
  const { hasPortionProducts, items } = portionsPage
  const body = getBody({
    hasPortionProducts,
    isGlobal,
    isSearching,
    itemsCount: items.length,
  })

  return {
    body,
    countLabel: isGlobal ? undefined : `(${linkedCount})`,
    hasPortionProducts,
    hasRows: linkedCount > 0,
    isGlobal,
    showsInactiveNotice: canManage && !isActive,
    showsPageActions: canManage,
    showsSearch: body === 'table' || body === 'search-empty' || searchInput !== '',
    subtitle: getSubtitle(isGlobal, linkedCount),
  }
}

function getBody({
  hasPortionProducts,
  isGlobal,
  isSearching,
  itemsCount,
}: {
  hasPortionProducts: boolean
  isGlobal: boolean
  isSearching: boolean
  itemsCount: number
}): PortionsCardBody {
  if (itemsCount > 0) return 'table'
  if (isSearching) return 'search-empty'
  if (isGlobal) return 'global-empty'
  return hasPortionProducts ? 'no-link' : 'no-portion-registered'
}

function getSubtitle(isGlobal: boolean, linkedCount: number) {
  if (isGlobal) return GLOBAL_SUBTITLE
  return linkedCount > 0 ? INDIVIDUAL_SUBTITLE : INDIVIDUAL_EMPTY_SUBTITLE
}
