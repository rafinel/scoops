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
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  useRemoveComboProductDialog,
  type RemoveComboProductDialogProps,
} from './use-remove-combo-product-dialog'

export type { RemoveComboProductDialogProps }

export const RemoveComboProductDialog = (props: RemoveComboProductDialogProps) => {
  const { handleConfirm, handleOpenChange } = useRemoveComboProductDialog(props)

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={props.open}>
      <AlertDialogContent
        className='sm:max-w-[440px]'
        finalFocus={props.resolveFinalFocus}
      >
        <AlertDialogHeader className='grid grid-cols-1 gap-3 border-b border-border-soft p-6 pr-14'>
          <AlertDialogMedia className='row-auto bg-destructive/10 text-destructive'>
            <Icon name='trash-2' />
          </AlertDialogMedia>
          <AlertDialogTitle className='col-start-1'>
            Remover produto do Combo?
          </AlertDialogTitle>
          <AlertDialogDescription className='col-start-1'>
            O produto {props.productName} será removido da composição. Você poderá
            adicioná-lo novamente antes de salvar o Combo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant='outline' />}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} variant='destructive'>
            <Icon name='trash-2' />
            Remover produto
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
