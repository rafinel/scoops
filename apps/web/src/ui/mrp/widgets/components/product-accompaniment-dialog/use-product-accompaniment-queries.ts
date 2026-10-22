import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import {
  getOwnSalePrice,
  type ProductAccompanimentDialogScope,
} from './product-accompaniment-dialog-scope'
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
  scope,
}: {
  isEdit: boolean
  item: ProductAccompanimentDetails | undefined
  open: boolean
  productId: string
  productIdValue: string
  form: UseFormReturn<ProductAccompanimentFormValues>
  scope: ProductAccompanimentDialogScope
}) {
  const pricingProductId = item ? item.accompanimentProductId : productIdValue
  const usesCandidates = !isEdit && scope.kind === 'portion'
  const candidatesQuery = useAccompanimentCandidatesQuery(
    productId,
    open && usesCandidates,
  )
  const typesQuery = useAccompanimentTypesQuery({ page: 1, pageSize: 100 })
  const selectedCandidate = usesCandidates
    ? candidatesQuery.data?.find((candidate) => candidate.productId === productIdValue)
    : undefined
  const pricingQuery = useProductPricingQuery(pricingProductId)
  const selectedStockQuery = useProductStockQuery(isEdit ? '' : productIdValue)
  useProductAccompanimentPriceSync({
    ownPrice: getOwnSalePrice(item, scope, selectedCandidate),
    form,
    open,
    pricing: pricingQuery.pricing,
    pricingProductId,
  })

  return {
    candidatesQuery,
    pricingProductId,
    pricingQuery,
    selectedCandidate,
    selectedStockQuery,
    typesQuery,
    usesCandidates,
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
  form: PricingForm
  open: boolean
  ownPrice: number | null | undefined
  pricing:
    | { accompanimentPrice?: number | null; suggestedAccompanimentPrice?: number | null }
    | undefined
  pricingProductId: string
}
function useProductAccompanimentPriceSync({
  form,
  open,
  ownPrice,
  pricing,
  pricingProductId,
}: PriceSyncOptions) {
  const lastPricingProductId = useRef<string | undefined>(undefined)
  useEffect(
    () =>
      updatePriceDefault(
        { form, open, ownPrice, pricing, pricingProductId },
        lastPricingProductId,
      ),
    [form, open, ownPrice, pricing, pricingProductId],
  )
}

function updatePriceDefault(
  { form, open, ownPrice, pricing, pricingProductId }: PriceSyncOptions,
  lastPricingProductId: { current: string | undefined },
) {
  if (open && shouldResetPriceDefault(form, pricingProductId, lastPricingProductId))
    resetPriceDefault(form, getInitialPrice(pricing, ownPrice))
  lastPricingProductId.current = open ? pricingProductId : undefined
}

function resetPriceDefault(form: PricingForm, price: number | null | undefined) {
  form.resetField('accompanimentPrice', {
    defaultValue: formatDefaultPrice(price),
  })
}

// An edited link or global starts from its own price; a new link or global starts from the
// Accompaniment's default price, else the Resale proposal.
function getInitialPrice(
  pricing:
    | { accompanimentPrice?: number | null; suggestedAccompanimentPrice?: number | null }
    | undefined,
  ownPrice: number | null | undefined,
) {
  return ownPrice ?? pricing?.accompanimentPrice ?? pricing?.suggestedAccompanimentPrice
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
