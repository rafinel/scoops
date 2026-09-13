import { Button } from '@/ui/shadcn/button'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { Dialog, DialogContent, DialogFooter } from '@/ui/shadcn/dialog'

import { ImpactRow } from './impact-row'
import { RemoveProductDialogHeader } from './remove-product-dialog-header'
import {
  useRemoveProductDialog,
  type RemoveProductDialogProps,
} from './use-remove-product-dialog'

export type { RemoveProductDialogProps }

export const RemoveProductDialog = (props: RemoveProductDialogProps) => {
  const {
    handleConfirm,
    handleOpenChange,
    hasProductRemovalImpactError,
    isLoadingProductRemovalImpact,
    isPendingProductRemovalImpact,
    isRefreshingProductRemovalImpact,
    isRemovingProduct,
    productRemovalImpact,
    removeProductError,
    retryProductRemovalImpact,
  } = useRemoveProductDialog(props)
  const impact = productRemovalImpact

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[calc(100vh-1rem)] overflow-y-auto data-open:animate-none sm:max-w-[560px]'>
        <RemoveProductDialogHeader
          impact={impact}
          isRefreshing={isRefreshingProductRemovalImpact}
          product={props.product}
        />
        <div className='grid gap-4 p-4 sm:p-6'>
          {isLoadingProductRemovalImpact || isPendingProductRemovalImpact ? (
            <div
              aria-label='Carregando impacto da remoção'
              className='grid gap-3'
              role='status'
            >
              <Skeleton className='h-12 rounded-xl' />
              <Skeleton className='h-12 rounded-xl' />
            </div>
          ) : null}
          {hasProductRemovalImpactError ? (
            <div
              className='grid gap-3 rounded-xl bg-danger/10 p-4 text-sm text-danger'
              role='alert'
            >
              <span>Não foi possível verificar o impacto da remoção.</span>
              <Button
                onClick={() => void retryProductRemovalImpact()}
                type='button'
                variant='outline'
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}
          {impact && !hasProductRemovalImpactError ? (
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
          {removeProductError ? (
            <p className='text-sm font-semibold text-danger' role='alert'>
              Não foi possível remover o produto. Corrija o impedimento e tente novamente.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={isRemovingProduct}
            onClick={() => handleOpenChange(false)}
            type='button'
            variant='outline'
          >
            Cancelar
          </Button>
          {impact && !hasProductRemovalImpactError ? (
            <Button
              color='danger'
              disabled={isRemovingProduct}
              onClick={() => void handleConfirm()}
              type='button'
            >
              {isRemovingProduct ? 'Removendo…' : 'Remover produto'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
