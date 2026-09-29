import type { GlobalSearchHit } from '@scoops/core/identity/domain/structures'

import { SearchResultGroups, type GlobalSearchGroup } from '../search-result-groups'
import { SearchResultState } from '../search-result-state'

export type SearchResultsPanelProps = {
  activeIndex: number
  debouncedQuery: string
  groups: GlobalSearchGroup[]
  id: string
  isEmpty: boolean
  isError: boolean
  isLoading: boolean
  onNavigate: (hit: GlobalSearchHit) => void
  onRetry: () => void
  resultCount: number
}

export const SearchResultsPanel = ({
  activeIndex,
  debouncedQuery,
  groups,
  id,
  isEmpty,
  isError,
  isLoading,
  onNavigate,
  onRetry,
  resultCount,
}: SearchResultsPanelProps) => (
  <div
    aria-label='Resultados da busca'
    className='absolute inset-x-0 top-[calc(100%+8px)] z-40 max-h-[min(32rem,calc(100vh-6rem))] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-dialog max-sm:-inset-x-3 max-sm:top-[calc(100%+5rem)] sm:w-[480px]'
    id={id}
    role='listbox'
  >
    {isLoading || isError || isEmpty ? (
      <SearchResultState
        debouncedQuery={debouncedQuery}
        isEmpty={isEmpty}
        isError={isError}
        isLoading={isLoading}
        onRetry={onRetry}
      />
    ) : (
      <>
        <div
          className='border-b border-border-soft px-3 pb-2 pt-1 text-xs text-muted-foreground'
          role='presentation'
        >
          {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
        </div>
        <SearchResultGroups
          activeIndex={activeIndex}
          groups={groups}
          listboxId={id}
          onNavigate={onNavigate}
        />
      </>
    )}
  </div>
)
