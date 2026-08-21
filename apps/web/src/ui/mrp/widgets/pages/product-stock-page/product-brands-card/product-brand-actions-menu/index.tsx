import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductBrandActionsMenuProps = {
  brand: ProductBrandStock
  disabled?: boolean
  onDelete: (brand: ProductBrandStock) => void
  onEdit: (brand: ProductBrandStock) => void
  onSetPrimary: (brand: ProductBrandStock) => void
}

export const ProductBrandActionsMenu = ({
  brand,
  disabled = false,
  onDelete,
  onEdit,
  onSetPrimary,
}: ProductBrandActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Abrir ações da marca ${brand.brand.name}`}
        className='grid size-9 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50'
        disabled={disabled}
      >
        <Icon className='size-4' name='ellipsis' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-[263px] max-w-[calc(100vw-1.5rem)] rounded-xl bg-card p-1.5 shadow-dialog [@media(max-height:240px)]:max-h-none [@media(max-height:240px)]:-translate-y-[108px] [@media(max-height:240px)]:animate-none'
        sideOffset={8}
      >
        <DropdownMenuItem
          className='min-h-11 gap-3 rounded-lg px-3 text-sm font-semibold'
          onClick={() => onEdit(brand)}
        >
          <Icon className='size-4 text-muted-foreground' name='pencil' />
          Editar marca
        </DropdownMenuItem>
        {!brand.brand.isPrimary ? (
          <DropdownMenuItem
            className='min-h-11 gap-3 rounded-lg px-3 text-sm font-semibold'
            onClick={() => onSetPrimary(brand)}
          >
            <Icon className='size-4 text-primary' name='check' />
            Definir como principal
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='min-h-11 gap-3 rounded-lg px-3 text-sm font-semibold'
          onClick={() => onDelete(brand)}
          variant='destructive'
        >
          <Icon className='size-4' name='trash-2' />
          Excluir marca
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
