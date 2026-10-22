import { Dialog, DialogContent } from '@/ui/shadcn/dialog'

import { LinkPortionsDialogActions } from './link-portions-dialog-actions'
import { LinkPortionsDialogFields } from './link-portions-dialog-fields'
import { LinkPortionsDialogHeader } from './link-portions-dialog-header'
import { useLinkPortionsDialog } from './use-link-portions-dialog'

export type LinkPortionsDialogProps = {
  onBecameGlobal: () => void
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  productId: string
}

export const LinkPortionsDialog = ({
  onOpenChange,
  open,
  ...hookProps
}: LinkPortionsDialogProps) => {
  const { canSubmit, handleSubmit, isPending, isRefreshing, submitLabel, ...fieldProps } =
    useLinkPortionsDialog({ open, ...hookProps })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden sm:max-w-lg'>
        <LinkPortionsDialogHeader isRefreshing={isRefreshing} />
        <form
          className='grid min-h-0 grid-rows-[minmax(0,1fr)_auto]'
          noValidate
          onSubmit={handleSubmit}
        >
          <LinkPortionsDialogFields {...fieldProps} />
          <LinkPortionsDialogActions
            canSubmit={canSubmit}
            isPending={isPending}
            onCancel={() => onOpenChange(false)}
            submitLabel={submitLabel}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
