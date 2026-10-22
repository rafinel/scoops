import { Icon } from '@/ui/shared/widgets/components/icon'

export type MakeIndividualDialogBodyProps = {
  actionError: string | null
}

export const MakeIndividualDialogBody = ({
  actionError,
}: MakeIndividualDialogBodyProps) => (
  <div className='grid gap-3 px-6 pt-0'>
    <div
      className='flex items-start gap-2.5 rounded-[10px] bg-muted px-3.5 py-2.5 text-[13px] font-medium text-foreground'
      role='status'
    >
      <Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' name='info' />
      <span>
        As porções atuais continuam com o acompanhamento como vínculo individual; novas
        porções não o receberão. Os saldos de estoque não mudam.
      </span>
    </div>
    {actionError ? (
      <p className='text-sm font-semibold text-destructive' role='alert'>
        {actionError}
      </p>
    ) : null}
  </div>
)
