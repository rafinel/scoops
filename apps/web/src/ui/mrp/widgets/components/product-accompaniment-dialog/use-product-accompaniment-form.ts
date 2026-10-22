import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { productAccompanimentFormSchema } from '@scoops/validation'
import type {
  GlobalAccompanimentDetails,
  ProductAccompanimentCandidate,
  ProductAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import {
  PORTION_SIDE_SCOPE,
  type ProductAccompanimentDialogScope,
} from './product-accompaniment-dialog-scope'

export type ProductAccompanimentFormValues = z.infer<
  typeof productAccompanimentFormSchema
>
type ProductAccompanimentDefaultSource = Partial<
  Pick<
    ProductAccompanimentDetails,
    | 'accompanimentProductId'
    | 'accompanimentTypeId'
    | 'isGlobal'
    | 'quantityPerPortion'
    | 'salePrice'
  >
>

export function useProductAccompanimentForm(
  item: ProductAccompanimentDetails | undefined,
  open: boolean,
  scope: ProductAccompanimentDialogScope = PORTION_SIDE_SCOPE,
) {
  const form = useProductAccompanimentFormInstance(item, scope)
  const [actionError, setActionError] = useState<string | null>(null)
  useResetProductAccompanimentForm(form, item, scope, open, setActionError)
  return useProductAccompanimentFormState(form, actionError, setActionError)
}

function useProductAccompanimentFormInstance(
  item: ProductAccompanimentDetails | undefined,
  scope: ProductAccompanimentDialogScope,
) {
  return useForm<ProductAccompanimentFormValues>({
    defaultValues: getDefaultValues(item, scope),
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
    handleGlobalChange: getGlobalChangeHandler(form, setActionError),
    handleValueChange: getValueChangeHandler(form, setActionError),
    selectCandidate: getCandidateSelector(form),
    setActionError,
  }
}

export type ProductAccompanimentFormState = ReturnType<typeof useProductAccompanimentForm>

function useProductAccompanimentFormFields(
  form: ReturnType<typeof useForm<ProductAccompanimentFormValues>>,
) {
  return {
    isGlobalValue: useWatch({ control: form.control, name: 'isGlobal' }),
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

function getGlobalChangeHandler(
  form: ReturnType<typeof useForm<ProductAccompanimentFormValues>>,
  setActionError: (value: string | null) => void,
) {
  return (checked: boolean) => {
    form.setValue('isGlobal', checked, { shouldDirty: true })
    setActionError(null)
  }
}

function getCandidateSelector(
  form: ReturnType<typeof useForm<ProductAccompanimentFormValues>>,
) {
  return (
    candidate: Pick<ProductAccompanimentCandidate, 'global' | 'isGlobal'> | undefined,
    previousCandidate: Pick<ProductAccompanimentCandidate, 'isGlobal'> | undefined,
  ) => {
    const options = { shouldDirty: true, shouldValidate: true }
    if (candidate?.isGlobal && candidate.global) {
      form.setValue('isGlobal', true, { shouldDirty: true })
      form.setValue('accompanimentTypeId', candidate.global.accompanimentTypeId, options)
      form.setValue(
        'quantityPerPortion',
        getDefaultQuantity(candidate.global.quantityPerPortion),
        options,
      )
      return
    }
    if (!previousCandidate?.isGlobal) return
    form.setValue('isGlobal', false, { shouldDirty: true })
    form.setValue('accompanimentTypeId', '', { shouldDirty: true })
    form.setValue('quantityPerPortion', '', { shouldDirty: true })
  }
}

function useResetProductAccompanimentForm(
  form: ReturnType<typeof useForm<ProductAccompanimentFormValues>>,
  item: ProductAccompanimentDetails | undefined,
  scope: ProductAccompanimentDialogScope,
  open: boolean,
  setActionError: (value: string | null) => void,
) {
  useEffect(() => {
    if (!open) return
    form.reset(getDefaultValues(item, scope))
    setActionError(null)
  }, [form, item, open, scope, setActionError])
}

function getDefaultValues(
  item: ProductAccompanimentDefaultSource | undefined,
  scope: ProductAccompanimentDialogScope,
): ProductAccompanimentFormValues {
  if (scope.kind === 'global' || scope.kind === 'make-global') {
    return getAccompanimentSideDefaultValues(scope.accompaniment, scope.kind === 'global')
  }
  return getItemDefaultValues(item)
}

function getAccompanimentSideDefaultValues(
  accompaniment: GlobalAccompanimentDetails,
  hasSharedValues: boolean,
): ProductAccompanimentFormValues {
  return {
    accompanimentProductId: accompaniment.accompanimentProductId,
    accompanimentTypeId: hasSharedValues ? (accompaniment.accompanimentTypeId ?? '') : '',
    accompanimentPrice: hasSharedValues ? getDefaultPrice(accompaniment.salePrice) : '',
    quantityPerPortion: hasSharedValues
      ? getDefaultQuantity(accompaniment.quantityPerPortion)
      : '',
    isGlobal: true,
  }
}

function getItemDefaultValues(
  item: ProductAccompanimentDefaultSource = {},
): ProductAccompanimentFormValues {
  return {
    accompanimentProductId: getDefaultValue(item.accompanimentProductId, ''),
    accompanimentTypeId: getDefaultValue(item.accompanimentTypeId, ''),
    accompanimentPrice: getDefaultPrice(item.salePrice ?? null),
    quantityPerPortion: getDefaultQuantity(item.quantityPerPortion),
    isGlobal: getDefaultValue(item.isGlobal, false),
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
