import type { ProductCategory } from '@scoops/core/mrp/domain/structures'
import type { ProductCategoryDependency } from '@scoops/core/mrp/domain/structures'

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

import {
  useCategoryDependencyDialog,
  type CategoryDependencyDialogProps,
} from './use-category-dependency-dialog'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}

export type { CategoryDependencyDialogProps }

export const CategoryDependencyDialog = (props: CategoryDependencyDialogProps) => {
  const { handleDependencyAction, handleOpenChange } = useCategoryDependencyDialog(props)
  const label = CATEGORY_LABELS[props.category]

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[calc(100vh-1rem)] overflow-y-auto data-open:animate-none sm:max-w-[560px]'>
        <DialogHeader className='grid gap-3 border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
          <span className='grid size-11 place-items-center rounded-xl bg-warning/10 text-warning'>
            <Icon className='size-5' name='link' />
          </span>
          <div>
            <DialogTitle>
              {props.isLoading
                ? 'Verificando vínculos…'
                : props.canRemove
                  ? `Remover categoria ${label}?`
                  : `${label} em uso`}
            </DialogTitle>
            <DialogDescription className='mt-1'>
              {props.isLoading
                ? 'Estamos verificando se existem cadastros que precisam de atenção.'
                : props.canRemove
                  ? `A categoria será removida de ${props.productName}.`
                  : `Revise os cadastros relacionados antes de remover ${label} deste produto.`}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className='grid gap-4 p-4 sm:p-6'>
          {props.isLoading ? (
            <div
              aria-label='Carregando vínculos da categoria'
              className='grid gap-3'
              role='status'
            >
              <div className='h-12 animate-pulse rounded-xl bg-muted motion-reduce:animate-none' />
              <div className='h-12 animate-pulse rounded-xl bg-muted motion-reduce:animate-none' />
            </div>
          ) : null}
          {props.error ? (
            <div
              className='grid gap-3 rounded-xl bg-danger/10 p-4 text-sm text-danger'
              role='alert'
            >
              <div className='flex items-start gap-2'>
                <Icon className='mt-0.5 size-4 shrink-0' name='triangle-alert' />
                <span>{props.error}</span>
              </div>
              <Button
                className='w-fit'
                onClick={props.onRetry}
                type='button'
                variant='outline'
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}
          {!props.isLoading && !props.error && props.dependencies.length > 0 ? (
            <ul aria-label='Cadastros relacionados' className='grid gap-2'>
              {props.dependencies.map((dependency) => (
                <li
                  className='flex items-center gap-3 rounded-xl border border-border-soft p-3'
                  key={`${dependency.kind}-${dependency.productId}`}
                >
                  <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground'>
                    <Icon name='link' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='font-bold'>{dependency.productName}</p>
                    <p className='text-xs text-muted-foreground'>
                      {dependencyLabel(dependency)}
                    </p>
                  </div>
                  {!props.canRemove ? (
                    <Button
                      onClick={() => handleDependencyAction(dependency)}
                      size='sm'
                      type='button'
                      variant='outline'
                    >
                      {dependencyActionLabel(dependency)}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {!props.isLoading && !props.error && props.canRemove ? (
            <p className='rounded-xl bg-muted p-3 text-sm text-muted-foreground'>
              Nenhum vínculo impede a remoção. Esta ação não remove histórico ou outros
              cadastros.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={props.isPending}
            onClick={() => handleOpenChange(false)}
            type='button'
            variant='outline'
          >
            {props.canRemove ? 'Cancelar' : 'Entendi'}
          </Button>
          {props.canRemove && !props.isLoading && !props.error ? (
            <Button disabled={props.isPending} onClick={props.onConfirm} type='button'>
              {props.isPending ? 'Removendo…' : 'Remover categoria'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function dependencyLabel(dependency: ProductCategoryDependency) {
  switch (dependency.kind) {
    case 'consuming-recipe':
      return 'Usado em receita'
    case 'owned-recipe':
      return 'Receita própria'
    case 'portion-size':
      return `${dependency.sizeCount} tamanho(s) configurado(s)`
    case 'portion-accompaniment':
      return `${dependency.linkCount} acompanhamento(s) vinculado(s)`
    case 'accompaniment-user':
      return 'Usado como acompanhamento'
    case 'resale-configuration':
      return `${dependency.configurationCount} configuração(ões) de revenda`
  }
}

function dependencyActionLabel(dependency: ProductCategoryDependency) {
  switch (dependency.kind) {
    case 'consuming-recipe':
    case 'owned-recipe':
      return 'Abrir receita'
    case 'portion-size':
      return 'Abrir tamanhos'
    case 'portion-accompaniment':
      return 'Abrir acompanhamentos'
    case 'accompaniment-user':
      return 'Ver produtos'
    case 'resale-configuration':
      return 'Abrir revenda'
  }
}
