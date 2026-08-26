import type { ProductCategoryDependency } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DependencyItemProps = {
  canRemove: boolean
  dependency: ProductCategoryDependency
  onAction: () => void
}

export const DependencyItem = ({
  canRemove,
  dependency,
  onAction,
}: DependencyItemProps) => {
  let description: string
  let actionLabel: string

  switch (dependency.kind) {
    case 'consuming-recipe':
      description = 'Usado em receita'
      actionLabel = 'Abrir receita'
      break
    case 'owned-recipe':
      description = 'Receita própria'
      actionLabel = 'Abrir receita'
      break
    case 'portion-size':
      description = `${dependency.sizeCount} tamanho(s) configurado(s)`
      actionLabel = 'Abrir tamanhos'
      break
    case 'portion-accompaniment':
      description = `${dependency.linkCount} acompanhamento(s) vinculado(s)`
      actionLabel = 'Abrir acompanhamentos'
      break
    case 'accompaniment-user':
      description = 'Usado como acompanhamento'
      actionLabel = 'Ver produtos'
      break
    case 'resale-configuration':
      description = `${dependency.configurationCount} configuração(ões) de revenda`
      actionLabel = 'Abrir revenda'
      break
  }

  return (
    <li
      className='flex items-center gap-3 rounded-xl border border-border-soft p-3'
      key={`${dependency.kind}-${dependency.productId}`}
    >
      <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground'>
        <Icon name='link' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='font-bold'>{dependency.productName}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      {!canRemove ? (
        <Button onClick={onAction} size='sm' type='button' variant='outline'>
          {actionLabel}
        </Button>
      ) : null}
    </li>
  )
}
