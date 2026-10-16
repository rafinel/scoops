import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { productAccompanimentFormSchema } from '@scoops/validation'
import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

export type ProductAccompanimentFormValues = z.infer<
  typeof productAccompanimentFormSchema
>
type ProductAccompanimentDefaultSource = Partial<
  Pick<
    ProductAccompanimentDetails,
    'accompanimentProductId' | 'accompanimentTypeId' | 'quantityPerPortion' | 'salePrice'
  >
>

export function useProductAccompanimentForm(
  item: ProductAccompanimentDetails | undefined,
  open: boolean,
) {
  const form = useProductAccompanimentFormInstance(item)
  const [actionError, setActionError] = useState<string | null>(null)
  useResetProductAccompanimentForm(form, item, open, setActionError)
  return useProductAccompanimentFormState(form, actionError, setActionError)
}

function useProductAccompanimentFormInstance(
  item: ProductAccompanimentDetails | undefined,
) {
  return useForm<ProductAccompanimentFormValues>({
    defaultValues: getDefaultValues(item),
    resolver: zodResolver(productAccompanimentFormSchema),
  })
}

function useProductAccompanimentFormState(
  form: ReturnType<typeof useForm<ProductAccompanimentFormValues>>,
  actionError: string | null,
  setActionError: (value: string | null) => void,
) {
  const formFields = useProductAccompanimentFormFields(form)
  return {
    actionError,
    form,
    ...formFields,
    handleValueChange: getValueChangeHandler(form, setActionError),
    setActionError,
  }
}

export type ProductAccompanimentFormState = ReturnType<typeof useProductAccompanimentForm>

function useProductAccompanimentFormFields(
  form: ReturnType<typeof useForm<ProductAccompanimentFormValues>>,
) {
  return {
    productIdValue: useWatch({ control: form.control, name: 'accompanimentProductId' }),
    quantity: useWatch({ control: form.control, name: 'quantityPerPortion' }),
    typeId: useWatch({ control: form.control, name: 'accompanimentTypeId' }),
  }
}

function getValueChangeHandler(
  form: ReturnType<typeof useForm<ProductAccompanimentFormValues>>,
  setActionError: (value: string | null) => void,
) {
  return (
    name: 'accompanimentProductId' | 'accompanimentTypeId',
    value: string | null,
  ) => {
    form.setValue(name, value ?? '', { shouldDirty: true, shouldValidate: true })
    setActionError(null)
  }
}

function useResetProductAccompanimentForm(
  form: ReturnType<typeof useForm<ProductAccompanimentFormValues>>,
  item: ProductAccompanimentDetails | undefined,
  open: boolean,
  setActionError: (value: string | null) => void,
) {
  useEffect(() => {
    if (!open) return
    form.reset(getDefaultValues(item))
    setActionError(null)
  }, [form, item, open, setActionError])
}

function getDefaultValues(
  item: ProductAccompanimentDefaultSource = {},
): ProductAccompanimentFormValues {
  return {
    accompanimentProductId: getDefaultValue(item.accompanimentProductId, ''),
    accompanimentTypeId: getDefaultValue(item.accompanimentTypeId, ''),
    accompanimentPrice: getDefaultPrice(item.salePrice ?? null),
    quantityPerPortion: getDefaultQuantity(item.quantityPerPortion),
  }
}

function getDefaultPrice(price: number | null) {
  return price === null ? '' : price.toFixed(2).replace('.', ',')
}

function getDefaultQuantity(quantity: number | undefined) {
  return String(quantity ?? '')
}

function getDefaultValue<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback
}
