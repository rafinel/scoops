import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { stockAdjustmentFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'

import { useAdjustProductStockAction } from '../../../../hooks/use-adjust-product-stock-action'

type FormValues = z.infer<typeof stockAdjustmentFormSchema>

export type UseStockAdjustmentDialogProps = {
  allowNegativeStock: boolean
  brand?: ProductBrandStock
  currentBalance: number
  isOpen: boolean
  productId: string
  type: 'entry' | 'write-off'
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function useStockAdjustmentDialog({
  allowNegativeStock,
  brand,
  currentBalance,
  isOpen,
  productId,
  type,
  onOpenChange,
  onSuccess,
}: UseStockAdjustmentDialogProps) {
  const adjustment = useAdjustProductStockAction(productId)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    reset,
    setValue,
    watch,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      inputMode: 'baseUnit',
      quantity: '',
      justification: '',
      packageQuantity: brand?.brand.packageQuantity,
    },
    resolver: zodResolver(stockAdjustmentFormSchema),
  })
  const inputMode = watch('inputMode')
  const quantity = watch('quantity')
  const numericQuantity = Number(quantity)
  const baseQuantity =
    Number.isFinite(numericQuantity) && numericQuantity > 0
      ? numericQuantity *
        (inputMode === 'package' ? (brand?.brand.packageQuantity ?? 0) : 1)
      : 0
  const prospectiveBalance =
    type === 'entry' ? currentBalance + baseQuantity : currentBalance - baseQuantity
  const isInsufficient =
    type === 'write-off' && !allowNegativeStock && prospectiveBalance < 0

  useEffect(() => {
    reset({
      inputMode: 'baseUnit',
      quantity: '',
      justification: '',
      packageQuantity: brand?.brand.packageQuantity,
    })
    if (isOpen) setFormError(null)
  }, [brand?.brand.packageQuantity, isOpen, reset])

  function handleInputModeChange(value: FormValues['inputMode']) {
    setValue('inputMode', value, { shouldDirty: true, shouldValidate: true })
    setFormError(null)
  }

  function handleQuantityChange() {
    setFormError(null)
  }

  function handleJustificationChange() {
    setFormError(null)
  }

  async function handleSubmit(values: FormValues) {
    const submittedQuantity =
      Number(values.quantity) *
      (values.inputMode === 'package' ? (values.packageQuantity ?? 0) : 1)

    if (type === 'write-off' && !allowNegativeStock && submittedQuantity > currentBalance)
      return

    setFormError(null)
    try {
      await adjustment.adjustProductStock({
        brandId: brand?.brand.id,
        quantity: submittedQuantity,
        type,
        justification: values.justification?.trim() || undefined,
      })
      reset({
        inputMode: 'baseUnit',
        quantity: '',
        justification: '',
        packageQuantity: brand?.brand.packageQuantity,
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      setFormError(
        error instanceof Error && error.message
          ? error.message
          : 'Não foi possível movimentar o estoque. Tente novamente.',
      )
    }
  }

  return {
    baseQuantity,
    errors,
    formError,
    inputMode,
    isInsufficient,
    isPending: adjustment.isPending,
    justification: watch('justification'),
    prospectiveBalance,
    quantity,
    handleInputModeChange,
    handleJustificationChange,
    handleQuantityChange,
    handleSubmit: submitForm(handleSubmit),
    register,
  }
}
