import type { ReactNode } from 'react'

import type { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { ProductCategory as ProductCategories } from '@scoops/core/mrp/domain/structures'

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

import type { ProductsSearch } from '../../../../hooks/use-products-query'
import { useProductFiltersDialog } from './use-product-filters-dialog'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

export function ProductFiltersDialog({
  isOpen,
  onOpenChange,
  onSearchChange,
  search,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSearchChange: (search: ProductsSearch) => void
  search: ProductsSearch
}) {
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
      <DialogContent className='flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden sm:max-w-[42rem]'>
        <DialogHeader className='border-b border-border-soft p-8 pr-20'>
          <span className='mb-2 grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='filter' className='size-5' />
          </span>
          <DialogTitle className='text-2xl'>Filtrar produtos</DialogTitle>
          <DialogDescription className='text-base'>
            Refine a lista por categoria, estoque e status.
          </DialogDescription>
        </DialogHeader>
        <div className='min-h-0 flex-1 space-y-7 overflow-y-auto p-8'>
          <div className='flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground'>
            <span>{filterGroupCount} grupos de filtros aplicados</span>
            <button
              className='font-bold text-primary'
              onClick={handleClear}
              type='button'
            >
              Limpar
            </button>
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
            >
              Baixo
            </FilterPill>
          </FilterGroup>
          <FilterGroup label='Status'>
            <FilterPill
              active={draftStatus === 'active'}
              onClick={() => handleStatusToggle('active')}
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
        <DialogFooter className='shrink-0'>
          <Button onClick={() => onOpenChange(false)} variant='outline'>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar filtros</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FilterGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <fieldset>
      <legend className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </legend>
      <div className='flex flex-wrap gap-2'>{children}</div>
    </fieldset>
  )
}

function FilterPill({
  active,
  children,
  onClick,
  tone,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  tone?: ProductCategory
}) {
  const activeTone =
    tone === ProductCategories.Ingredient
      ? 'border-blue-600 bg-blue-50 text-blue-800'
      : tone === ProductCategories.Manufacturable
        ? 'border-primary bg-accent text-primary'
        : tone === ProductCategories.Accompaniment
          ? 'border-amber-400 bg-amber-50 text-amber-800'
          : tone === ProductCategories.Resale
            ? 'border-red-300 bg-red-50 text-red-700'
            : tone === ProductCategories.Portion
              ? 'border-green-400 bg-green-50 text-green-800'
              : 'border-primary bg-accent text-primary'

  return (
    <button
      aria-pressed={active}
      className={`rounded-xl border px-3.5 py-2 text-sm transition-colors ${active ? `${activeTone} font-semibold` : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}
      onClick={onClick}
      type='button'
    >
      {children}
    </button>
  )
}
