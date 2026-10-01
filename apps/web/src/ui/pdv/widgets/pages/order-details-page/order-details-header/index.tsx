import type { ReactNode } from 'react'
import type { OrderStatus } from '@scoops/core/pdv/domain/structures'

import { OrderDetailsBody } from './order-details-body'
import { useOrderDetailsHeader } from './use-order-details-header'

export type OrderDetailsHeaderProps = {
  printAction: ReactNode
  canCancel: boolean
  canceledAt?: Date
  createdAt: Date
  isRefreshing: boolean
  onBack: () => void
  onOpenCancel: () => void
  sequenceNumber: number
  status: OrderStatus
}

export const OrderDetailsHeader = (props: OrderDetailsHeaderProps) => {
  const { sequence, isCanceled, timestamp, handleBack, handleOpenCancel } =
    useOrderDetailsHeader(props)
  const display = { sequence, isCanceled, timestamp }
  const callbacks = { onBack: handleBack, onOpenCancel: handleOpenCancel }
  return <OrderDetailsBody {...props} {...display} {...callbacks} />
}
