import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RemoveProductDialogHeaderProps = {
  accompanimentName: string
  portionName?: string
}

export const RemoveProductDialogHeader = ({
  accompanimentName,
  portionName,
}: RemoveProductDialogHeaderProps) => (
  <AlertDialogHeader className='p-6'>
    <AlertDialogMedia className='bg-destructive/10 text-destructive'>
      <Icon name='trash-2' />
    </AlertDialogMedia>
    <AlertDialogTitle>Remover acompanhamento?</AlertDialogTitle>
    <AlertDialogDescription>
      O vínculo de {accompanimentName}
      {portionName ? ` com ${portionName}` : ''} será removido. O estoque e o histórico
      permanecem intactos.
    </AlertDialogDescription>
  </AlertDialogHeader>
)
