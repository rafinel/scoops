import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RemovalHeaderProps = {
  description: string
  name: string
}

export const RemovalHeader = ({ description, name }: RemovalHeaderProps) => (
  <AlertDialogHeader className='p-6 pr-14'>
    <AlertDialogMedia className='size-11 rounded-xl bg-danger-soft text-danger'>
      <Icon name='trash-2' />
    </AlertDialogMedia>
    <AlertDialogTitle>Remover {name}?</AlertDialogTitle>
    <AlertDialogDescription>{description}</AlertDialogDescription>
  </AlertDialogHeader>
)
