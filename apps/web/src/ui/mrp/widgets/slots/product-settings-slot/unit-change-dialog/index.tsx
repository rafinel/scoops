import { Button } from '@/ui/shadcn/button'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { Dialog, DialogContent, DialogFooter } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ImpactRow } from './impact-row'
import { UnitChangeDialogHeader } from './unit-change-dialog-header'
import { useUnitChangeDialog, type UnitChangeDialogProps } from './use-unit-change-dialog'

export type { UnitChangeDialogProps }

export const UnitChangeDialog = (props: UnitChangeDialogProps) => {
  const {
    changeProductUnitError,
    handleConfirm,
    handleOpenChange,
    hasUnitChangePreviewError,
    isChangingProductUnit,
    isLoadingUnitChangePreview,
    isPendingUnitChangePreview,
    isRefreshingUnitChangePreview,
    retryUnitChangePreview,
    unitChangePreview,
  } = useUnitChangeDialog(props)

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[calc(100vh-1rem)] overflow-y-auto data-open:animate-none sm:max-w-[520px]'>
        <UnitChangeDialogHeader isRefreshing={isRefreshingUnitChangePreview} />
        <div className='grid gap-4 p-4 sm:p-6'>
          <div className='flex items-center justify-center gap-3 rounded-xl bg-muted p-4 text-center font-extrabold'>
            <span>{props.currentUnit}</span>
            <Icon className='size-4 text-muted-foreground' name='arrow' />
            <span>{props.targetUnit}</span>
          </div>
          {isLoadingUnitChangePreview || isPendingUnitChangePreview ? (
            <div
              aria-label='Carregando impacto da alteração de unidade'
              className='grid gap-3'
              role='status'
            >
              <Skeleton className='h-11 rounded-xl' />
              <Skeleton className='h-11 rounded-xl' />
            </div>
          ) : null}
          {hasUnitChangePreviewError ? (
            <div
              className='grid gap-3 rounded-xl bg-danger/10 p-4 text-sm text-danger'
              role='alert'
            >
              <span>Não foi possível verificar a alteração de unidade.</span>
              <Button
                onClick={() => void retryUnitChangePreview()}
                type='button'
                variant='outline'
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}
          {unitChangePreview && !hasUnitChangePreviewError ? (
            <>
              <div className='grid gap-2 rounded-xl border border-border-soft p-4 text-sm'>
                <p className='font-extrabold'>O que será atualizado</p>
                <ImpactRow label='Saldos' value={unitChangePreview.affected.balances} />
                <ImpactRow
                  label='Ingredientes em receitas'
                  value={unitChangePreview.affected.recipeIngredients}
                />
                <ImpactRow
                  label='Rendimentos de receitas'
                  value={unitChangePreview.affected.recipeYields}
                />
                <ImpactRow label='Tamanhos' value={unitChangePreview.affected.sizes} />
                <ImpactRow
                  label='Acompanhamentos'
                  value={unitChangePreview.affected.accompanimentLinks}
                />
              </div>
              <div
                className='rounded-xl bg-muted p-3 text-sm text-muted-foreground'
                role='note'
              >
                Estoques, custos, receitas, tamanhos e acompanhamentos manterão seus
                valores numéricos e adotarão a nova unidade.
              </div>
              {changeProductUnitError ? (
                <p className='text-sm font-semibold text-danger' role='alert'>
                  Não foi possível alterar a unidade. Tente novamente.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            disabled={isChangingProductUnit}
            onClick={() => handleOpenChange(false)}
            type='button'
            variant='outline'
          >
            Cancelar
          </Button>
          {unitChangePreview && !hasUnitChangePreviewError ? (
            <Button
              disabled={isChangingProductUnit}
              onClick={() => void handleConfirm()}
              type='button'
            >
              {isChangingProductUnit ? 'Salvando…' : 'Alterar unidade'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
