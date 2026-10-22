import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { type UseFormReturn, useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { accompanimentPortionsFormSchema } from '@scoops/validation'

export type LinkPortionsFormValues = z.infer<typeof accompanimentPortionsFormSchema>

export type PricingSource = {
  accompanimentPrice?: number | null
  suggestedAccompanimentPrice?: number | null
}

export function useLinkPortionsForm(open: boolean, pricing: PricingSource | undefined) {
  const form = useForm<LinkPortionsFormValues>({
    defaultValues: getDefaultValues(),
    resolver: zodResolver(accompanimentPortionsFormSchema),
  })
  const wasOpenRef = useRef(false)

  useEffect(() => {
    // The form restarts only when the dialog opens, not when its reads refetch.
    if (open && !wasOpenRef.current) form.reset(getDefaultValues())
    wasOpenRef.current = open
  }, [form, open])
  // The price starts at the Accompaniment's default price, else the Resale proposal.
  useLinkPortionsPriceSync(
    form,
    open,
    pricing?.accompanimentPrice ?? pricing?.suggestedAccompanimentPrice,
  )

  return {
    form,
    portionProductIds: useWatch({ control: form.control, name: 'portionProductIds' }),
    quantity: useWatch({ control: form.control, name: 'quantityPerPortion' }),
    typeId: useWatch({ control: form.control, name: 'accompanimentTypeId' }),
  }
}

function useLinkPortionsPriceSync(
  form: UseFormReturn<LinkPortionsFormValues>,
  open: boolean,
  initialPrice: number | null | undefined,
) {
  const { formState, setValue } = form
  const isDirtyPrice = Boolean(formState.dirtyFields.accompanimentPrice)

  useEffect(() => {
    if (open && !isDirtyPrice) setValue('accompanimentPrice', formatPrice(initialPrice))
  }, [initialPrice, isDirtyPrice, open, setValue])
}

function getDefaultValues(): LinkPortionsFormValues {
  return {
    accompanimentPrice: '',
    accompanimentTypeId: '',
    portionProductIds: [],
    quantityPerPortion: '',
  }
}

export function formatPrice(price: number | null | undefined) {
  return price === null || price === undefined ? '' : price.toFixed(2).replace('.', ',')
}
