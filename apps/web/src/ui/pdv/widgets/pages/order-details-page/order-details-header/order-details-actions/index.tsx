import type { ReactNode } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderDetailsActionsProps = {
  isCanceled: boolean
  timestamp: string
  printAction: ReactNode
  canCancel: boolean
  onOpenCancel: () => void
}

export const OrderDetailsActions = ({
  isCanceled,
  timestamp,
  printAction,
  canCancel,
  onOpenCancel,
}: OrderDetailsActionsProps) => (
  <div className='flex w-full flex-col gap-3 sm:w-auto sm:items-end'>
    {isCanceled ? (
      <p className='text-sm font-bold text-danger'>Cancelado em {timestamp}</p>
    ) : (
      <p className='text-sm text-muted-foreground'>{timestamp}</p>
    )}
    <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
      {printAction}
      {canCancel ? (
        <Button
          color='danger'
          className='bg-danger text-white hover:bg-danger/80'
          onClick={onOpenCancel}
          type='button'
          variant='destructive'
        >
          <Icon name='x' /> Cancelar pedido
        </Button>
      ) : null}
    </div>
  </div>
)
