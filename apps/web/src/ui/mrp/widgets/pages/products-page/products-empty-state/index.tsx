import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useProductsEmptyState } from './use-products-empty-state'

export function ProductsEmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean
  onClear: () => void
}) {
  const { description, title } = useProductsEmptyState(hasFilters)

  return (
    <div className='rounded-xl border border-dashed p-10 text-center'>
      <Icon name='package' className='mx-auto size-10 text-muted-foreground' />
      <h2 className='mt-4 text-lg font-extrabold'>{title}</h2>
      <p className='mx-auto mt-2 max-w-md text-sm text-muted-foreground'>{description}</p>
      {hasFilters ? (
        <Button className='mt-4' onClick={onClear} variant='outline'>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}
