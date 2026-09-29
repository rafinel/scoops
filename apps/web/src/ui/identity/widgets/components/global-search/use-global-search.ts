import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import type { GlobalSearchHit } from '@scoops/core/identity/domain/structures'
import type { GlobalSearchResults } from '@scoops/core/identity/domain/structures'

import {
  discountDetailsRoute,
  GLOBAL_SEARCH_PAGE_ROUTES,
  orderDetailsRoute,
  productDetailsRoute,
  ROUTES,
} from '@/constants/routes'
import { useGlobalSearchQuery } from '@/ui/identity/hooks/use-global-search-query'

const DEBOUNCE_MS = 250

type Navigate = ReturnType<typeof useNavigate>

type SearchKeyboardState = {
  activeIndex: number
  flattenedHits: GlobalSearchHit[]
  inputRef: React.RefObject<HTMLInputElement | null>
  isOpen: boolean
  navigateToHit: (hit: GlobalSearchHit) => void
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

function navigateToSearchHit(hit: GlobalSearchHit, navigate: Navigate) {
  switch (hit.kind) {
    case 'page':
      void navigate({ to: GLOBAL_SEARCH_PAGE_ROUTES[hit.pageKey] } as never)
      break
    case 'product':
      void navigate({ to: productDetailsRoute(hit.productId) } as never)
      break
    case 'order':
      void navigate({ to: orderDetailsRoute(hit.orderId) } as never)
      break
    case 'user':
      void navigate({ to: ROUTES.userDetails, params: { userId: hit.userId } } as never)
      break
    case 'salesChannel':
      void navigate({
        to: ROUTES.salesChannels,
        search: { search: hit.label },
      } as never)
      break
    case 'discount':
      void navigate({ to: discountDetailsRoute(hit.discountId) } as never)
      break
  }
}

function handleSearchKeyDown(
  event: React.KeyboardEvent<HTMLInputElement>,
  state: SearchKeyboardState,
) {
  const {
    activeIndex,
    flattenedHits,
    inputRef,
    isOpen,
    navigateToHit,
    setActiveIndex,
    setIsOpen,
  } = state

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) =>
        flattenedHits.length ? (index + 1) % flattenedHits.length : -1,
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) =>
        flattenedHits.length ? (index <= 0 ? flattenedHits.length - 1 : index - 1) : -1,
      )
      break
    case 'Enter': {
      const hit = activeIndex >= 0 ? flattenedHits[activeIndex] : undefined
      if (hit) {
        event.preventDefault()
        navigateToHit(hit)
      }
      break
    }
    case 'Escape':
      if (isOpen) {
        event.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        inputRef.current?.focus()
      }
      break
    case 'Tab':
      setIsOpen(false)
      setActiveIndex(-1)
      break
  }
}

function useDebouncedSearchQuery(normalizedInput: string, isQueryValid: boolean) {
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    if (!isQueryValid) {
      setDebouncedQuery('')
      return
    }
    const timeout = window.setTimeout(
      () => setDebouncedQuery(normalizedInput),
      DEBOUNCE_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [isQueryValid, normalizedInput])

  return debouncedQuery
}

function useGlobalSearchGroups(data: GlobalSearchResults | undefined) {
  return useMemo(
    () =>
      GLOBAL_SEARCH_GROUPS.map((group) => ({
        ...group,
        hits: (data?.[group.key] ?? []) as GlobalSearchHit[],
      })).filter((group) => group.hits.length > 0),
    [data],
  )
}

export const GLOBAL_SEARCH_GROUPS = [
  { key: 'pages', label: 'Páginas' },
  { key: 'products', label: 'Produtos' },
  { key: 'orders', label: 'Pedidos' },
  { key: 'users', label: 'Usuários' },
  { key: 'salesChannels', label: 'Canais de venda' },
  { key: 'discounts', label: 'Descontos' },
] as const satisfies ReadonlyArray<{
  key: keyof GlobalSearchResults
  label: string
}>

export function useGlobalSearch() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const normalizedInput = input.trim()
  const isQueryValid = normalizedInput.length > 0 && normalizedInput.length <= 100
  const debouncedQuery = useDebouncedSearchQuery(normalizedInput, isQueryValid)
  const query = useGlobalSearchQuery(debouncedQuery)
  const groups = useGlobalSearchGroups(query.data)
  const flattenedHits = useMemo(() => groups.flatMap((group) => group.hits), [groups])
  const isWaitingForDebounce = isQueryValid && debouncedQuery !== normalizedInput
  const isLoading = isQueryValid && (isWaitingForDebounce || query.isPending)
  const isError = isQueryValid && !isWaitingForDebounce && query.isError
  const isEmpty =
    isQueryValid && !isWaitingForDebounce && query.isSuccess && flattenedHits.length === 0
  const resultCount = flattenedHits.length

  function handleChange(value: string) {
    setInput(value.slice(0, 101))
    setIsOpen(Boolean(value.trim()))
    setActiveIndex(-1)
  }

  function handleClose() {
    setIsOpen(false)
    setActiveIndex(-1)
  }

  function handleRetry() {
    void query.refetch()
  }

  function handleNavigate(hit: GlobalSearchHit) {
    navigateToSearchHit(hit, navigate)
    handleClose()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    handleSearchKeyDown(event, {
      activeIndex,
      flattenedHits,
      inputRef,
      isOpen,
      navigateToHit: handleNavigate,
      setActiveIndex,
      setIsOpen,
    })
  }

  return {
    activeIndex,
    debouncedQuery,
    flattenedHits,
    groups,
    input,
    inputRef,
    isEmpty,
    isError,
    isLoading,
    isOpen: isOpen && isQueryValid,
    resultCount,
    handleChange,
    handleKeyDown,
    handleNavigate,
    handleRetry,
  }
}
