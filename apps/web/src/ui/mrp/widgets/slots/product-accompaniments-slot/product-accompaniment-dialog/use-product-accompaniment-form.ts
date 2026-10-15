import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { productAccompanimentFormSchema } from '@scoops/validation'
import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

export type ProductAccompanimentFormValues = z.infer<
  typeof productAccompanimentFormSchema
>

export function useProductAccompanimentForm(
  item: ProductAccompanimentDetails | undefined,
  open: boolean,
) {
  const form = useForm<ProductAccompanimentFormValues>({
    defaultValues: getDefaultValues(item),
    resolver: zodResolver(productAccompanimentFormSchema),
  })
  const [actionError, setActionError] = useState<string | null>(null)
  useResetProductAccompanimentForm(form, item, open, setActionError)
  const productIdValue = useWatch({
    control: form.control,
    name: 'accompanimentProductId',
  })
  const typeId = useWatch({ control: form.control, name: 'accompanimentTypeId' })
  const quantity = useWatch({ control: form.control, name: 'quantityPerPortion' })
  const handleValueChange = (
    name: 'accompanimentProductId' | 'accompanimentTypeId',
    value: string | null,
  ) => {
    form.setValue(name, value ?? '', { shouldDirty: true, shouldValidate: true })
    setActionError(null)
  }

  return {
    actionError,
    form,
    handleValueChange,
    productIdValue,
    quantity,
    setActionError,
    typeId,
  }
}

export type ProductAccompanimentFormState = ReturnType<typeof useProductAccompanimentForm>

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
  item?: ProductAccompanimentDetails,
): ProductAccompanimentFormValues {
  return {
    accompanimentProductId: item?.accompanimentProductId ?? '',
    accompanimentTypeId: item?.accompanimentTypeId ?? '',
    quantityPerPortion: item ? String(item.quantityPerPortion) : '',
    accompanimentPrice: '',
  }
}
