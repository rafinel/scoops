import { useEffect, useRef } from 'react'
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
  useProductAccompanimentPriceSync(form, open, pricingProductId, pricingQuery.pricing)

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

function useProductAccompanimentPriceSync(
  form: PricingForm,
  open: boolean,
  pricingProductId: string,
  pricing:
    | { accompanimentPrice?: number | null; suggestedAccompanimentPrice?: number | null }
    | undefined,
) {
  const lastPricingProductId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!open) {
      lastPricingProductId.current = undefined
      return
    }
    updatePriceDefault(form, pricingProductId, pricing, lastPricingProductId)
  }, [form, open, pricing, pricingProductId])
}

function updatePriceDefault(
  form: PricingForm,
  pricingProductId: string,
  pricing:
    | { accompanimentPrice?: number | null; suggestedAccompanimentPrice?: number | null }
    | undefined,
  lastPricingProductId: { current: string | undefined },
) {
  const savedPrice = pricing?.accompanimentPrice ?? null
  const initialPrice = savedPrice ?? pricing?.suggestedAccompanimentPrice ?? null
  const defaultValue =
    initialPrice === null ? '' : initialPrice.toFixed(2).replace('.', ',')
  const hasChangedTarget = lastPricingProductId.current !== pricingProductId
  if (hasChangedTarget || !form.formState.dirtyFields.accompanimentPrice) {
    form.resetField('accompanimentPrice', { defaultValue })
  }
  lastPricingProductId.current = pricingProductId
}
