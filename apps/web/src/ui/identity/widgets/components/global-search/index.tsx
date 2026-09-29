import { useId } from 'react'

import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { SearchResultsPanel } from './search-results-panel'
import { useGlobalSearch } from './use-global-search'

const getAnnouncement = ({
  isLoading,
  isError,
  isEmpty,
  resultCount,
}: {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  resultCount: number
}) =>
  isLoading
    ? 'Buscando resultados'
    : isError
      ? 'Não foi possível buscar. Tente novamente.'
      : isEmpty
        ? 'Nenhum resultado encontrado.'
        : resultCount > 0
          ? `${resultCount} ${resultCount === 1 ? 'resultado encontrado' : 'resultados encontrados'}`
          : ''

export const GlobalSearch = () => {
  const listboxId = useId()
  const {
    activeIndex,
    debouncedQuery,
    groups,
    input,
    inputRef,
    isEmpty,
    isError,
    isLoading,
    isOpen,
    resultCount,
    handleChange,
    handleKeyDown,
    handleNavigate,
    handleRetry,
  } = useGlobalSearch()
  const announcement = getAnnouncement({ isLoading, isError, isEmpty, resultCount })

  return (
    <div className='relative order-1 w-full min-w-0 sm:order-none sm:flex-1'>
      <div className='flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20'>
        <Icon className='size-[18px] shrink-0 text-muted-foreground' name='search' />
        <Input
          id={`${listboxId}-input`}
          ref={inputRef}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete='list'
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-label='Buscar no Scoops'
          className='h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium shadow-none placeholder:text-muted-foreground focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0'
          maxLength={101}
          onChange={(event) => handleChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder='Buscar no Scoops...'
          role='combobox'
          value={input}
        />
      </div>
      <span aria-atomic='true' aria-live='polite' className='sr-only'>
        {announcement}
      </span>
      {isOpen ? (
        <SearchResultsPanel
          activeIndex={activeIndex}
          debouncedQuery={debouncedQuery}
          groups={groups}
          id={listboxId}
          isEmpty={isEmpty}
          isError={isError}
          isLoading={isLoading}
          onNavigate={handleNavigate}
          onRetry={handleRetry}
          resultCount={resultCount}
        />
      ) : null}
    </div>
  )
}
