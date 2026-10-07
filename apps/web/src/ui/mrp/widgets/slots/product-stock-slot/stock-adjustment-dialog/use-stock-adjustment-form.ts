import { zodResolver } from '@hookform/resolvers/zod'
import { stockAdjustmentFormSchema } from '@scoops/validation'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentFormSchema>
type StockAdjustmentForm = ReturnType<typeof useForm<StockAdjustmentFormValues>>
type StockAdjustmentFormInput = {
  brand?: ProductBrandStock
  currentBalance: number
  type: 'entry' | 'write-off'
}
type StockAdjustmentLiveValueInput = StockAdjustmentFormInput & {
  form: Pick<StockAdjustmentForm, 'watch'>
}
type StockAdjustmentBalanceInput = Pick<
  StockAdjustmentFormInput,
  'currentBalance' | 'type'
> & { baseQuantity: number }

function getStockAdjustmentDefaultValues(brand: ProductBrandStock | undefined) {
  return {
    inputMode: 'baseUnit' as const,
    quantity: '',
    justification: '',
    packageQuantity: brand?.brand.packageQuantity,
  }
}

function getStockAdjustmentFormOptions(brand: ProductBrandStock | undefined) {
  return {
    defaultValues: getStockAdjustmentDefaultValues(brand),
    resolver: zodResolver(stockAdjustmentFormSchema),
  }
}

function getProspectiveStockBalance(
  type: 'entry' | 'write-off',
  currentBalance: number,
  baseQuantity: number,
) {
  return type === 'entry' ? currentBalance + baseQuantity : currentBalance - baseQuantity
}

export function useStockAdjustmentForm({
  brand,
  currentBalance,
  type,
}: StockAdjustmentFormInput) {
  const form = useForm<StockAdjustmentFormValues>(getStockAdjustmentFormOptions(brand))
  return {
    ...form,
    errors: form.formState.errors,
    ...getStockAdjustmentLiveValues({ form, brand, currentBalance, type }),
  }
}

function getStockAdjustmentLiveValues({
  form,
  brand,
  currentBalance,
  type,
}: StockAdjustmentLiveValueInput) {
  const liveFields = watchStockAdjustmentFields(form)
  const baseQuantity = getProductBaseQuantity(liveFields, brand)
  return {
    ...liveFields,
    baseQuantity,
    ...getStockAdjustmentBalanceState({ type, currentBalance, baseQuantity }),
  }
}

function getProductBaseQuantity(
  fields: ReturnType<typeof watchStockAdjustmentFields>,
  brand: ProductBrandStock | undefined,
) {
  return getBaseQuantity(
    Number(fields.quantity),
    fields.inputMode,
    brand?.brand.packageQuantity,
  )
}

function watchStockAdjustmentFields(form: Pick<StockAdjustmentForm, 'watch'>) {
  const [inputMode, quantity, justification] = form.watch([
    'inputMode',
    'quantity',
    'justification',
  ])
  return { inputMode, quantity, justification }
}

function getStockAdjustmentBalanceState({
  type,
  currentBalance,
  baseQuantity,
}: StockAdjustmentBalanceInput) {
  const prospectiveBalance = getProspectiveStockBalance(
    type,
    currentBalance,
    baseQuantity,
  )
  return {
    isInsufficient: isInsufficientStockWriteOff(type, prospectiveBalance),
    prospectiveBalance,
  }
}

function isInsufficientStockWriteOff(type: 'entry' | 'write-off', balance: number) {
  return type === 'write-off' && balance < 0
}

function getBaseQuantity(
  numericQuantity: number,
  inputMode: StockAdjustmentFormValues['inputMode'],
  packageQuantity: number | undefined,
) {
  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) return 0
  return numericQuantity * (inputMode === 'package' ? (packageQuantity ?? 0) : 1)
}
