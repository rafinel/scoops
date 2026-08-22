import type { ReactNode } from 'react'

import type { ProductCategory } from '@scoops/core/mrp/domain/structures'
import { ProductCategory as ProductCategories } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'

export type FilterPillProps = {
  active: boolean
  children: ReactNode
  onClick: () => void
  tone?: ProductCategory | 'stock-low' | 'status-active'
}

export const FilterPill = ({ active, children, onClick, tone }: FilterPillProps) => {
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
              : tone === 'stock-low'
                ? 'border-red-800 !bg-red-50 !text-red-800'
                : tone === 'status-active'
                  ? 'border-green-800 !bg-green-50 !text-green-800'
                  : 'border-primary bg-accent text-primary'

  return (
    <Button
      aria-pressed={active}
      className={`rounded-lg border px-2.5 py-1.5 !text-xs font-semibold transition-colors ${active ? activeTone : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}
      onClick={onClick}
      type='button'
      variant='outline'
    >
      {children}
    </Button>
  )
}
