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
  useRemoveProductDialog,
  type RemoveProductDialogProps,
} from './use-remove-product-dialog'

export type { RemoveProductDialogProps }

export const RemoveProductDialog = (props: RemoveProductDialogProps) => {
  const state = useRemoveProductDialog(props)
  const impact = state.productRemovalImpact

  return (
    <Dialog open={props.open} onOpenChange={state.handleOpenChange}>
      <DialogContent className='max-h-[calc(100vh-1rem)] overflow-y-auto data-open:animate-none sm:max-w-[560px]'>
        <DialogHeader className='grid gap-3 border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
          <span className='grid size-11 place-items-center rounded-xl bg-danger/10 text-danger'>
            <Icon className='size-5' name='trash-2' />
          </span>
          <div>
            <DialogTitle>Remover produto?</DialogTitle>
            <DialogDescription className='mt-1'>
              {impact?.productName ?? props.product.name} será removido do catálogo.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className='grid gap-4 p-4 sm:p-6'>
          {state.isLoadingProductRemovalImpact || state.isPendingProductRemovalImpact ? (
            <div
              aria-label='Carregando impacto da remoção'
              className='grid gap-3'
              role='status'
            >
              <div className='h-12 animate-pulse rounded-xl bg-muted motion-reduce:animate-none' />
              <div className='h-12 animate-pulse rounded-xl bg-muted motion-reduce:animate-none' />
            </div>
          ) : null}
          {state.hasProductRemovalImpactError ? (
            <div
              className='grid gap-3 rounded-xl bg-danger/10 p-4 text-sm text-danger'
              role='alert'
            >
              <span>Não foi possível verificar o impacto da remoção.</span>
              <Button
                onClick={() => void state.retryProductRemovalImpact()}
                type='button'
                variant='outline'
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}
          {impact && !state.hasProductRemovalImpactError ? (
            <>
              <div className='grid gap-2 rounded-xl border border-border-soft p-4'>
                <p className='font-extrabold'>Serão removidos</p>
                <ImpactRow label='Marcas' value={impact.removable.brands} />
                <ImpactRow label='Saldos' value={impact.removable.balances} />
                <ImpactRow label='Receita própria' value={impact.removable.ownedRecipe} />
                <ImpactRow label='Tamanhos' value={impact.removable.sizes} />
                <ImpactRow
                  label='Acompanhamentos do produto'
                  value={impact.removable.ownedAccompanimentLinks}
                />
                <ImpactRow
                  label='Configurações de revenda'
                  value={impact.removable.resaleConfigurations}
                />
                <ImpactRow
                  label='Vínculos em receitas'
                  value={impact.removable.consumingRecipeLinks}
                />
                <ImpactRow
                  label='Vínculos de acompanhamento'
                  value={impact.removable.inverseAccompanimentLinks}
                />
              </div>
              <p className='rounded-xl bg-muted p-3 text-sm text-muted-foreground'>
                Nenhuma remoção parcial será feita. Histórico de estoque, produções e
                pedidos será preservado.
              </p>
            </>
          ) : null}
          {state.removeProductError ? (
            <p className='text-sm font-semibold text-danger' role='alert'>
              Não foi possível remover o produto. Corrija o impedimento e tente novamente.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={state.isRemovingProduct}
            onClick={() => state.handleOpenChange(false)}
            type='button'
            variant='outline'
          >
            Cancelar
          </Button>
          {impact && !state.hasProductRemovalImpactError ? (
            <Button
              color='danger'
              disabled={state.isRemovingProduct}
              onClick={() => void state.handleConfirm()}
              type='button'
            >
              {state.isRemovingProduct ? 'Removendo…' : 'Remover produto'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ImpactRow({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex items-center justify-between gap-4 border-t border-border-soft pt-2 first:border-t-0 first:pt-0'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <strong className='text-sm'>{value}</strong>
    </div>
  )
}
