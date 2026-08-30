import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { cancelOrderSchema, type CancelOrderInput } from '@scoops/validation'

import { useCancelOrderAction } from '@/ui/pdv/hooks/use-cancel-order-action'
import { showErrorToast } from '@/ui/shared/notifications'

export type CancelOrderDialogProps = {
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  order: OrderDetails
}

export function useCancelOrderDialog({
  onOpenChange,
  onSuccess,
  order,
}: CancelOrderDialogProps) {
  const { cancelOrder, cancelOrderError, isCancelingOrder } = useCancelOrderAction()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<CancelOrderInput>({
    defaultValues: { reason: '' },
    resolver: zodResolver(cancelOrderSchema),
  })

  async function handleSubmit(input: CancelOrderInput) {
    setSubmitError(null)
    try {
      const reason = input.reason?.trim() || undefined
      await cancelOrder({ orderId: order.id, reason })
      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Não foi possível cancelar o pedido.'
      setSubmitError(message)
      showErrorToast('Não foi possível cancelar o pedido. Tente novamente.')
    }
  }

  function handleClose() {
    if (isCancelingOrder) return
    onOpenChange(false)
  }

  return {
    cancelOrderError,
    errorMessage: submitError,
    fieldError: form.formState.errors.reason?.message,
    handleClose,
    handleSubmit: form.handleSubmit(handleSubmit),
    isCancelingOrder,
    register: form.register,
  }
}
