import { useDebouncedValue } from '@/ui/shared/hooks/use-debounced-value'

const SEARCH_DEBOUNCE_MS = 250

export function useEffectiveSearch(search: string) {
  const trimmedSearch = search.trim()
  const isEmpty = trimmedSearch === ''
  const debouncedSearch = useDebouncedValue(trimmedSearch, SEARCH_DEBOUNCE_MS, isEmpty)

  return isEmpty || debouncedSearch === '' ? undefined : debouncedSearch
}
