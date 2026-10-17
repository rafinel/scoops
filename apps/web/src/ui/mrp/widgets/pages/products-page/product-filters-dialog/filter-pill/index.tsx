import type { ReactNode } from 'react'

import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { CATEGORY_OUTLINE_CLASSES } from '@/constants'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { IconName } from '@/ui/shared/widgets/components/icon/types'

export type FilterPillProps = {
  active: boolean
  children: ReactNode
  icon: IconName
  onClick: () => void
  tone?: ProductCategory | 'stock-low' | 'status-active'
}

export const FilterPill = ({
  active,
  children,
  icon,
  onClick,
  tone,
}: FilterPillProps) => {
  const activeTone =
    tone === 'stock-low'
      ? 'border-red-800 !bg-red-50 !text-red-800'
      : tone === 'status-active'
        ? 'border-green-800 !bg-green-50 !text-green-800'
        : tone
          ? CATEGORY_OUTLINE_CLASSES[tone]
          : 'border-primary bg-accent text-primary'

  return (
    <Button
      aria-pressed={active}
      className={`gap-1.5 rounded-lg border px-2.5 py-1.5 !text-xs font-semibold transition-colors ${active ? activeTone : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}
      onClick={onClick}
      type='button'
      variant='outline'
    >
      <Icon className='size-3.5 shrink-0' name={icon} />
      {children}
    </Button>
  )
}
