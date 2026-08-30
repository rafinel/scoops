import { useState } from 'react'

import { UserProfile } from '@scoops/core/identity/domain/structures'

import { useOrderQuery } from '@/ui/pdv/hooks/use-order-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type OrderDetailsPageProps = { orderId: string }

export function useOrderDetailsPage(orderId: string) {
  const { account } = useAuthContext()
  const { navigateTo } = useNavigation()
  const { isLoadingOrder, order, orderError, refetchOrder } = useOrderQuery(orderId)
  const [isCancelOpen, setCancelOpen] = useState(false)

  function handleBack() {
    void navigateTo('orders')
  }

  function handleOpenCancel() {
    setCancelOpen(true)
  }

  function handleCancelOpenChange(open: boolean) {
    setCancelOpen(open)
  }

  function handleRetry() {
    void refetchOrder()
  }

  const canCancel =
    account?.profile === UserProfile.Manager && order?.status === 'registered'

  return {
    canCancel,
    isCancelOpen,
    isLoadingOrder,
    order,
    orderError,
    handleBack,
    handleCancelOpenChange,
    handleOpenCancel,
    handleRetry,
  }
}
