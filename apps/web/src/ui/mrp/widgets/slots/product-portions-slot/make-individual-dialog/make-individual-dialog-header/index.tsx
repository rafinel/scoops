import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type MakeIndividualDialogHeaderProps = {
  accompanimentName: string
}

export const MakeIndividualDialogHeader = ({
  accompanimentName,
}: MakeIndividualDialogHeaderProps) => (
  <AlertDialogHeader className='p-6 pr-14'>
    <AlertDialogMedia className='size-11 rounded-xl bg-accent text-primary'>
      <Icon name='link' />
    </AlertDialogMedia>
    <AlertDialogTitle>Tornar {accompanimentName} individual?</AlertDialogTitle>
    <AlertDialogDescription>
      {accompanimentName} deixará de ser global.
    </AlertDialogDescription>
  </AlertDialogHeader>
)
