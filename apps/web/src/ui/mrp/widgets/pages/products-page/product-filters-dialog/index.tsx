import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ProductsSearch } from '@/ui/mrp/hooks/use-products-query'
import { FilterGroup } from './filter-group'
import { FilterPill } from './filter-pill'
import { useProductFiltersDialog } from './use-product-filters-dialog'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

export type ProductFiltersDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSearchChange: (search: ProductsSearch) => void
  search: ProductsSearch
}

export const ProductFiltersDialog = ({
  isOpen,
  onOpenChange,
  onSearchChange,
  search,
}: ProductFiltersDialogProps) => {
  const {
    draftCategories,
    draftStatus,
    draftStockSituation,
    filterGroupCount,
    handleApply,
    handleCategoryToggle,
    handleClear,
    handleStatusToggle,
    handleStockSituationToggle,
  } = useProductFiltersDialog({ isOpen, onOpenChange, onSearchChange, search })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden sm:max-w-lg'>
        <DialogHeader className='flex-row items-start gap-3 p-6 pb-0 pr-16'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='filter' className='size-[22px]' />
          </span>
          <div className='min-w-0 pt-0.5'>
            <DialogTitle className='text-xl'>Filtrar produtos</DialogTitle>
            <DialogDescription className='mt-1 text-[13px]'>
              Refine a lista por categoria, estoque e status.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5'>
          <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground'>
            <span>{filterGroupCount} grupos de filtros aplicados</span>
            <Button
              className='h-auto p-0 font-bold border-none'
              onClick={handleClear}
              variant='outline'
            >
              Limpar
            </Button>
          </div>
          <FilterGroup label='Categoria'>
            {CATEGORY_VALUES.map((category) => (
              <FilterPill
                active={draftCategories.includes(category)}
                key={category}
                onClick={() => handleCategoryToggle(category)}
                tone={category}
              >
                {CATEGORY_LABELS[category]}
              </FilterPill>
            ))}
          </FilterGroup>
          <FilterGroup label='Estoque'>
            <FilterPill
              active={draftStockSituation === 'normal'}
              onClick={() => handleStockSituationToggle('normal')}
            >
              Normal
            </FilterPill>
            <FilterPill
              active={draftStockSituation === 'low'}
              onClick={() => handleStockSituationToggle('low')}
              tone='stock-low'
            >
              Baixo
            </FilterPill>
          </FilterGroup>
          <FilterGroup label='Status'>
            <FilterPill
              active={draftStatus === 'active'}
              onClick={() => handleStatusToggle('active')}
              tone='status-active'
            >
              Ativo
            </FilterPill>
            <FilterPill
              active={draftStatus === 'inactive'}
              onClick={() => handleStatusToggle('inactive')}
            >
              Inativo
            </FilterPill>
          </FilterGroup>
        </div>
        <DialogFooter className='shrink-0 gap-3 px-6 py-4'>
          <Button
            className='h-8 px-5 text-[13px] font-bold'
            onClick={() => onOpenChange(false)}
            variant='outline'
          >
            Cancelar
          </Button>
          <Button className='h-8 px-3.5 text-[13px] font-bold' onClick={handleApply}>
            Aplicar filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
