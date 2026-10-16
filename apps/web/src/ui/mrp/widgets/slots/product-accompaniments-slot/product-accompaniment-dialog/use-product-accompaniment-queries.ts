import { useEffect, useMemo, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import type { ProductAccompanimentFormValues } from './use-product-accompaniment-form'
import { useAccompanimentCandidatesQuery } from '@/ui/mrp/hooks/use-accompaniment-candidates-query'
import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useProductPricingQuery } from '@/ui/mrp/hooks/use-product-pricing-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'

export function useProductAccompanimentQueries({
  isEdit,
  item,
  open,
  productId,
  productIdValue,
  form,
}: {
  isEdit: boolean
  item: ProductAccompanimentDetails | undefined
  open: boolean
  productId: string
  productIdValue: string
  form: UseFormReturn<ProductAccompanimentFormValues>
}) {
  const pricingProductId = isEdit ? (item?.accompanimentProductId ?? '') : productIdValue
  const candidatesQuery = useAccompanimentCandidatesQuery(productId, open && !isEdit)
  const typesQuery = useAccompanimentTypesQuery({ page: 1, pageSize: 100 })
  const pricingQuery = useProductPricingQuery(pricingProductId)
  const selectedStockQuery = useProductStockQuery(isEdit ? '' : productIdValue)
  const priceSyncOptions = useMemo(
    () => ({
      fallbackPrice: item?.salePrice,
      form,
      open,
      pricing: pricingQuery.pricing,
      pricingProductId,
    }),
    [form, item?.salePrice, open, pricingQuery.pricing, pricingProductId],
  )
  useProductAccompanimentPriceSync(priceSyncOptions)

  return {
    candidatesQuery,
    pricingProductId,
    pricingQuery,
    selectedStockQuery,
    typesQuery,
  }
}

export type ProductAccompanimentQueries = ReturnType<
  typeof useProductAccompanimentQueries
>

type PricingForm = Pick<
  UseFormReturn<ProductAccompanimentFormValues>,
  'formState' | 'resetField'
>

type PriceSyncOptions = {
  fallbackPrice: number | null | undefined
  form: PricingForm
  open: boolean
  pricing:
    | { accompanimentPrice?: number | null; suggestedAccompanimentPrice?: number | null }
    | undefined
  pricingProductId: string
}
function useProductAccompanimentPriceSync(options: PriceSyncOptions) {
  const lastPricingProductId = useRef<string | undefined>(undefined)
  useEffect(() => updatePriceDefault(options, lastPricingProductId), [options])
}

function updatePriceDefault(
  { fallbackPrice, form, open, pricing, pricingProductId }: PriceSyncOptions,
  lastPricingProductId: { current: string | undefined },
) {
  if (open && shouldResetPriceDefault(form, pricingProductId, lastPricingProductId))
    resetPriceDefault(form, getInitialPrice(pricing, fallbackPrice))
  lastPricingProductId.current = open ? pricingProductId : undefined
}

function resetPriceDefault(form: PricingForm, price: number | null | undefined) {
  form.resetField('accompanimentPrice', {
    defaultValue: formatDefaultPrice(price),
  })
}

function getInitialPrice(
  pricing:
    | { accompanimentPrice?: number | null; suggestedAccompanimentPrice?: number | null }
    | undefined,
  fallbackPrice: number | null | undefined,
) {
  return (
    pricing?.accompanimentPrice ?? pricing?.suggestedAccompanimentPrice ?? fallbackPrice
  )
}

function formatDefaultPrice(price: number | null | undefined) {
  return price === null || price === undefined ? '' : price.toFixed(2).replace('.', ',')
}

function shouldResetPriceDefault(
  form: PricingForm,
  pricingProductId: string,
  lastPricingProductId: { current: string | undefined },
) {
  return (
    lastPricingProductId.current !== pricingProductId ||
    !form.formState.dirtyFields.accompanimentPrice
  )
}
