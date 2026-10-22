import { useEffect, useState } from 'react'

import type { AccompanimentPortionsPage } from '@scoops/core/mrp/domain/structures'

import { useAccompanimentPortionsQuery } from '@/ui/mrp/hooks/use-accompaniment-portions-query'
import { useDebouncedValue } from '@/ui/shared/hooks/use-debounced-value'

export const PORTIONS_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

type PageState = { page: number; search: string | undefined }

function usePortionsSearch() {
  const [searchInput, setSearchInput] = useState('')
  const trimmedSearch = searchInput.trim()
  const debounced = useDebouncedValue(
    trimmedSearch,
    SEARCH_DEBOUNCE_MS,
    trimmedSearch === '',
  )

  function handleSearchChange(value: string) {
    setSearchInput(value)
  }

  return {
    search: debounced === '' ? undefined : debounced,
    searchInput,
    handleSearchChange,
  }
}

function usePortionsPaging(search: string | undefined) {
  const [pageState, setPageState] = useState<PageState>({ page: 1, search: undefined })

  useEffect(() => {
    setPageState((current) => (current.search === search ? current : { page: 1, search }))
  }, [search])

  function handlePageChange(page: number) {
    setPageState({ page, search })
  }

  return {
    requestedPage: pageState.search === search ? pageState.page : 1,
    handlePageChange,
  }
}

// While a search is active the page total is filtered, so the unfiltered total comes from a
// separate one-row read that exists only during a search and is refreshed by every mutation.
function useUnfilteredTotal(
  productId: string,
  isEligible: boolean,
  search: string | undefined,
  page: AccompanimentPortionsPage | undefined,
) {
  const countQuery = useAccompanimentPortionsQuery(
    productId,
    { page: 1, pageSize: 1 },
    isEligible && search !== undefined,
  )

  return search === undefined
    ? (page?.total ?? 0)
    : (countQuery.data?.total ?? page?.total ?? 0)
}

export function usePortionsListState(productId: string, isEligible: boolean) {
  const { search, searchInput, handleSearchChange } = usePortionsSearch()
  const { requestedPage, handlePageChange } = usePortionsPaging(search)
  const query = useAccompanimentPortionsQuery(
    productId,
    { page: requestedPage, pageSize: PORTIONS_PAGE_SIZE, search },
    isEligible,
  )
  const linkedCount = useUnfilteredTotal(productId, isEligible, search, query.data)

  return {
    isPageLoading: query.isPlaceholderData,
    isSearching: search !== undefined,
    linkedCount,
    listStatus: {
      isError: query.isError,
      isFetching: query.isFetching,
      isPending: query.isPending,
    },
    portionsPage: query.data,
    searchInput,
    handlePageChange,
    handleSearchChange,
    refetchPortions: query.refetch,
  }
}
