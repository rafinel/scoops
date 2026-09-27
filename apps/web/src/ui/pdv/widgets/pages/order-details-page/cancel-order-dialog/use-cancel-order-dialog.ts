import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { cancelOrderSchema, type CancelOrderInput } from '@scoops/validation'

import { useCancelOrderAction } from '@/ui/pdv/hooks/use-cancel-order-action'

export type CancelOrderDialogProps = {
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  order: OrderDetails
}
type CancelOrderDisposition = CancelOrderInput['lineDispositions'][number]

export function useCancelOrderDialog({
  onOpenChange,
  onSuccess,
  order,
}: CancelOrderDialogProps) {
  const { cancelOrder, cancelOrderError, isCancelingOrder } = useCancelOrderAction()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm<CancelOrderInput>({
    defaultValues: createCancelOrderDefaults(order),
    resolver: zodResolver(cancelOrderSchema),
  })

  const handleSubmit = createCancelOrderSubmitHandler({
    cancelOrder,
    onOpenChange,
    onSuccess,
    orderId: order.id,
    reset: form.reset,
    setSubmitError,
  })

  function handleClose() {
    if (isCancelingOrder) return
    setSubmitError(null)
    form.reset(createCancelOrderDefaults(order))
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
    watch: form.watch,
  }
}

function createCancelOrderDefaults(order: OrderDetails): CancelOrderInput {
  return {
    reason: '',
    lineDispositions: order.lines.map(
      (_line, linePosition): CancelOrderDisposition => ({
        linePosition,
        disposition: 'return',
      }),
    ),
  }
}

function createCancelOrderSubmitHandler({
  cancelOrder,
  onOpenChange,
  onSuccess,
  orderId,
  reset,
  setSubmitError,
}: {
  cancelOrder: ReturnType<typeof useCancelOrderAction>['cancelOrder']
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  orderId: string
  reset: () => void
  setSubmitError: (error: string | null) => void
}) {
  return async (input: CancelOrderInput) => {
    setSubmitError(null)
    try {
      await cancelOrder(createCancelOrderRequest(orderId, input))
      completeCancelOrder(onSuccess, onOpenChange, reset)
    } catch (caught) {
      setSubmitError(getCancelOrderErrorMessage(caught))
    }
  }
}

function getCancelOrderErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : 'Não foi possível cancelar o pedido.'
}

function createCancelOrderRequest(orderId: string, input: CancelOrderInput) {
  return {
    orderId,
    reason: input.reason?.trim() || undefined,
    lineDispositions: input.lineDispositions,
  }
}

function completeCancelOrder(
  onSuccess: () => void,
  onOpenChange: (open: boolean) => void,
  reset: () => void,
) {
  onSuccess()
  onOpenChange(false)
  reset()
}
