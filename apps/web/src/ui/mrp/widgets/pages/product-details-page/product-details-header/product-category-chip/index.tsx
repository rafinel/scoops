import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { CATEGORY_ICONS, CATEGORY_OUTLINE_CLASSES } from '@/constants'
import { GlobalBadge } from '@/ui/mrp/widgets/components/global-badge'
import { Badge } from '@/ui/shadcn/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'
import { Icon } from '@/ui/shared/widgets/components/icon'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}

export type ProductCategoryChipProps = {
  category: ProductCategory
  isGlobal: boolean
}

export const ProductCategoryChip = ({ category, isGlobal }: ProductCategoryChipProps) => (
  <Tooltip>
    <TooltipTrigger
      aria-label={
        isGlobal ? `${CATEGORY_LABELS[category]} global` : CATEGORY_LABELS[category]
      }
      className='rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    >
      <Badge
        className={`h-8 gap-1.5 px-3 font-semibold ${CATEGORY_OUTLINE_CLASSES[category]}`}
        variant='outline'
      >
        <Icon name={CATEGORY_ICONS[category]} className='size-4' />
        {CATEGORY_LABELS[category]}
        {isGlobal ? <GlobalBadge /> : null}
      </Badge>
    </TooltipTrigger>
    <TooltipContent>{CATEGORY_LABELS[category]}</TooltipContent>
  </Tooltip>
)
