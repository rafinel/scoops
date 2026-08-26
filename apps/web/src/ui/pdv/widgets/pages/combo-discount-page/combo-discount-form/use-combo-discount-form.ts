import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import type {
  ComboComponentDetails,
  ComboDetails,
  DiscountStatus,
} from '@scoops/core/pdv/domain/structures'
import { comboDiscountFormSchema } from '@scoops/validation'

import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDecimal } from '@/ui/shared/hooks/use-format-decimal'

import type { ComboProductDetails } from '../combo-product-dialog/use-combo-product-dialog'

export type ComboDiscountFormInput = z.input<typeof comboDiscountFormSchema>
export type ComboDiscountFormValues = z.output<typeof comboDiscountFormSchema>
export type ComboDiscountFormMode = 'create' | 'edit'

export type ComboDiscountFormProps = {
  initialDetails?: ComboDetails
  isPending: boolean
  mode: ComboDiscountFormMode
  onCancel: () => void
  onRequestStatusChange: (status: DiscountStatus) => void
  onSubmit: (values: ComboDiscountFormValues) => Promise<void>
  submitError: string | null
}

const roundCents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

function detailsToComponents(details: ComboDetails | undefined): ComboComponentDetails[] {
  return details ? [...details.components] : []
}

function detailsToFormValues(
  details: ComboDetails | undefined,
  formatDecimal: (value: number) => string,
): ComboDiscountFormInput {
  if (!details) {
    return { name: '', status: 'active', fixedPrice: '', components: [] }
  }

  return {
    name: details.combo.name,
    status: details.combo.status,
    fixedPrice: formatDecimal(details.combo.fixedPrice),
    components: details.combo.components.map((component) =>
      component.kind === 'portion'
        ? { ...component, accompanimentIds: [...component.accompanimentIds] }
        : { ...component },
    ),
  }
}

export function useComboDiscountForm({
  initialDetails,
  isPending,
  mode,
  onCancel,
  onRequestStatusChange,
  onSubmit,
  submitError,
}: ComboDiscountFormProps) {
  const formatCurrency = useFormatCurrency()
  const formatDecimal = useFormatDecimal()
  const form = useForm<ComboDiscountFormInput, undefined, ComboDiscountFormValues>({
    defaultValues: detailsToFormValues(initialDetails, formatDecimal),
    resolver: zodResolver(comboDiscountFormSchema),
  })
  const components = useWatch({ control: form.control, name: 'components' }) ?? []
  const fixedPrice = useWatch({ control: form.control, name: 'fixedPrice' }) ?? ''
  const status = useWatch({ control: form.control, name: 'status' }) ?? 'active'
  const [componentDetails, setComponentDetails] = useState<ComboComponentDetails[]>(() =>
    detailsToComponents(initialDetails),
  )
  const [isProductDialogOpen, setProductDialogOpen] = useState(false)
  const [isRemoveProductDialogOpen, setRemoveProductDialogOpen] = useState(false)
  const [componentPendingRemoval, setComponentPendingRemoval] =
    useState<ComboComponentDetails>()
  const addProductButtonRef = useRef<HTMLButtonElement>(null)
  const removeProductTriggerRef = useRef<HTMLButtonElement>(null)
  const fixedPriceNumber = Number(String(fixedPrice).replace(',', '.')) || 0
  const normalPrice = roundCents(
    components.reduce(
      (total, component, index) =>
        total + (componentDetails[index]?.unitPrice ?? 0) * component.quantity,
      0,
    ),
  )
  const savings = roundCents(normalPrice - fixedPriceNumber)

  useEffect(() => {
    const fixedPriceError = form.formState.errors.fixedPrice
    if (fixedPriceError?.type !== 'manual') return

    const pricingIsValid = status !== 'active' || normalPrice > fixedPriceNumber
    if (pricingIsValid) form.clearErrors('fixedPrice')
  }, [fixedPriceNumber, form, normalPrice, status])

  useEffect(() => {
    form.reset(detailsToFormValues(initialDetails, formatDecimal))
    setComponentDetails(detailsToComponents(initialDetails))
    setProductDialogOpen(false)
    setRemoveProductDialogOpen(false)
    setComponentPendingRemoval(undefined)
  }, [formatDecimal, form, initialDetails])

  function handleAddComponent(details: ComboProductDetails) {
    if (
      components.some((component) => component.productId === details.component.productId)
    ) {
      form.setError('components', {
        message: 'Este produto já foi adicionado ao Combo.',
        type: 'manual',
      })
      return
    }

    form.clearErrors('components')
    setComponentDetails((current) => [...current, details])
    const component =
      details.component.kind === 'portion'
        ? {
            ...details.component,
            accompanimentIds: [...details.component.accompanimentIds],
          }
        : { ...details.component }
    form.setValue('components', [...components, component], {
      shouldDirty: true,
      shouldValidate: true,
    })
    setProductDialogOpen(false)
  }

  function handleProductDialogOpenChange(open: boolean) {
    setProductDialogOpen(open)
  }

  function handleOpenProductDialog() {
    setProductDialogOpen(true)
  }

  function handleRequestRemoveComponent(index: number, trigger: HTMLButtonElement) {
    const selectedComponent = componentDetails[index]
    if (!selectedComponent) return

    removeProductTriggerRef.current = trigger
    setComponentPendingRemoval(selectedComponent)
    setRemoveProductDialogOpen(true)
  }

  function handleRemoveProductDialogOpenChange(open: boolean) {
    setRemoveProductDialogOpen(open)
  }

  function handleConfirmRemoveComponent() {
    const selectedProductId = componentPendingRemoval?.component.productId
    if (!selectedProductId) return

    setComponentDetails((current) =>
      current.filter((details) => details.component.productId !== selectedProductId),
    )
    form.setValue(
      'components',
      components.filter((component) => component.productId !== selectedProductId),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  function resolveRemoveProductFinalFocus() {
    if (removeProductTriggerRef.current?.isConnected) {
      return removeProductTriggerRef.current
    }

    return addProductButtonRef.current
  }

  function handleQuantityChange(index: number, quantity: number) {
    const nextQuantity = Math.max(1, Math.floor(quantity))
    const nextComponents = components.map((component, itemIndex) =>
      itemIndex === index ? { ...component, quantity: nextQuantity } : component,
    )
    setComponentDetails((current) =>
      current.map((details, itemIndex) =>
        itemIndex === index
          ? {
              ...details,
              component: nextComponents[index],
              subtotal: roundCents(details.unitPrice * nextQuantity),
            }
          : details,
      ),
    )
    form.setValue('components', nextComponents, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  async function handleValidSubmit(values: ComboDiscountFormValues) {
    if (isPending) return
    if (values.status === 'active' && normalPrice <= values.fixedPrice) {
      form.setError('fixedPrice', {
        message: 'O preço do combo deve ser menor que o valor normal dos produtos.',
        type: 'manual',
      })
      return
    }
    await onSubmit(values)
  }

  function handleStatusChange(nextStatus: DiscountStatus) {
    if (mode === 'edit') {
      onRequestStatusChange(nextStatus)
      return
    }
    form.setValue('status', nextStatus, { shouldDirty: true, shouldValidate: true })
  }

  return {
    addProductButtonRef,
    componentDetails,
    componentPendingRemoval,
    errors: form.formState.errors,
    fixedPriceNumber,
    formatCurrency,
    isProductDialogOpen,
    isRemoveProductDialogOpen,
    isSubmitDisabled: isPending || components.length < 2,
    normalPrice,
    savings,
    status,
    submitError,
    handleAddComponent,
    handleCancel: onCancel,
    handleConfirmRemoveComponent,
    handleOpenProductDialog,
    handleProductDialogOpenChange,
    handleQuantityChange,
    handleRemoveProductDialogOpenChange,
    handleRequestRemoveComponent,
    handleSubmit: form.handleSubmit(handleValidSubmit),
    handleStatusChange,
    resolveRemoveProductFinalFocus,
    register: form.register,
  }
}
