import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useRemoveProductBrandDialog } from './use-remove-product-brand-dialog'

export type RemoveProductBrandDialogProps = {
  brand: ProductBrandStock
  hasSiblingBrands?: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  open: boolean
  productId: string
}

export const RemoveProductBrandDialog = (props: RemoveProductBrandDialogProps) => {
  const { brand, hasSiblingBrands = false, open } = props
  const { error, isPending, handleConfirm, handleOpenChange } =
    useRemoveProductBrandDialog(props)
  const isProtectedPrimary = brand.brand.isPrimary && hasSiblingBrands

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className='max-h-[calc(100vh-1rem)] max-w-[calc(100%-2rem)] overflow-y-auto bg-card data-open:animate-none sm:max-w-[520px]'>
        <AlertDialogHeader className='place-items-start gap-1.5 border-b border-border-soft p-5 pr-14 text-left sm:p-6 sm:pr-14'>
          <AlertDialogMedia className='mb-2 bg-destructive/10 text-destructive'>
            <Icon className='size-5' name='trash-2' />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir marca?</AlertDialogTitle>
          <AlertDialogDescription className='leading-relaxed'>
            A marca <strong className='text-foreground'>{brand.brand.name}</strong> e seu
            saldo atual de estoque serão removidos. Vínculos dependentes conhecidos também
            serão removidos, mas o histórico de movimentações permanecerá preservado.
          </AlertDialogDescription>
          {isProtectedPrimary ? (
            <p
              className='mt-3 rounded-xl bg-destructive/5 p-3 text-sm font-semibold text-destructive'
              role='alert'
            >
              Defina outra marca como principal antes de excluir esta marca.
            </p>
          ) : null}
          {error ? (
            <p className='mt-3 text-sm font-semibold text-destructive' role='alert'>
              Não foi possível excluir a marca. Corrija o impedimento e tente novamente.
            </p>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className='bg-muted min-[560px]:flex-row min-[560px]:justify-end'>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive text-white shadow-destructive hover:bg-destructive/90'
            disabled={isPending || isProtectedPrimary}
            onClick={handleConfirm}
          >
            <Icon className='size-4' name='trash-2' />
            {isPending ? 'Excluindo…' : 'Excluir marca'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
