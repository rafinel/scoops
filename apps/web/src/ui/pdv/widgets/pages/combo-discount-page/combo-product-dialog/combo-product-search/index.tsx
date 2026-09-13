import type { SaleItemKind } from '@scoops/core/pdv/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { ComboProductQueryStatus } from '@/ui/pdv/widgets/pages/combo-discount-page/combo-product-dialog/combo-product-query-status'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ComboProductSearchProps = {
  isLoading: boolean
  isRefreshing: boolean
  kind: SaleItemKind | undefined
  onFilterChange: (kind: SaleItemKind | undefined) => void
  onSearchChange: (search: string) => void
  search: string
}

export const ComboProductSearch = (props: ComboProductSearchProps) => (
  <>
    <div className='flex gap-2'>
      {(['all', 'portion', 'resale'] as const).map((filter) => {
        const filterKind = filter === 'all' ? undefined : filter
        return (
          <Button
            aria-pressed={props.kind === filterKind}
            key={filter}
            onClick={() => props.onFilterChange(filterKind)}
            size='sm'
            type='button'
            variant={props.kind === filterKind ? 'default' : 'outline'}
          >
            {filter === 'all' ? 'Todos' : filter === 'portion' ? 'Porções' : 'Revendas'}
          </Button>
        )
      })}
    </div>
    <label
      className='flex items-center gap-2 rounded-lg border bg-card px-3'
      htmlFor='combo-product-search'
    >
      <Icon name='search' className='size-4 text-muted-foreground' />
      <Input
        aria-label='Buscar produtos'
        className='h-10 border-0 px-0 shadow-none focus-visible:ring-0'
        id='combo-product-search'
        onChange={(event) => props.onSearchChange(event.target.value)}
        placeholder='Buscar produto…'
        value={props.search}
      />
    </label>
    <ComboProductQueryStatus
      isLoading={props.isLoading}
      isRefreshing={props.isRefreshing}
    />
  </>
)
