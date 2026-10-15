import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { productAccompanimentFormSchema } from '@scoops/validation'
import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { useAccompanimentCandidatesQuery } from '@/ui/mrp/hooks/use-accompaniment-candidates-query'
import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useLinkProductAccompanimentAction } from '@/ui/mrp/hooks/use-link-product-accompaniment-action'
import { useProductPricingQuery } from '@/ui/mrp/hooks/use-product-pricing-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useUpdateProductAccompanimentAction } from '@/ui/mrp/hooks/use-update-product-accompaniment-action'

type FormValues = z.infer<typeof productAccompanimentFormSchema>

export function useProductAccompanimentDialog({
  item,
  onSuccess,
  open,
  productId,
}: {
  item?: ProductAccompanimentDetails
  onSuccess: () => void
  open: boolean
  productId: string
}) {
  const form = useForm<FormValues>({
    defaultValues: getDefaultValues(item),
    resolver: zodResolver(productAccompanimentFormSchema),
  })
  const productIdValue = useWatch({
    control: form.control,
    name: 'accompanimentProductId',
  })
  const typeId = useWatch({ control: form.control, name: 'accompanimentTypeId' })
  const quantity = useWatch({ control: form.control, name: 'quantityPerPortion' })
  const isEdit = Boolean(item)
  const pricingProductId = isEdit ? (item?.accompanimentProductId ?? '') : productIdValue
  const candidatesQuery = useAccompanimentCandidatesQuery(productId, open && !isEdit)
  const typesQuery = useAccompanimentTypesQuery({ page: 1, pageSize: 100 })
  const pricingQuery = useProductPricingQuery(pricingProductId)
  const selectedStockQuery = useProductStockQuery(isEdit ? '' : productIdValue)
  const linkAction = useLinkProductAccompanimentAction(productId)
  const updateAction = useUpdateProductAccompanimentAction(productId)
  const [actionError, setActionError] = useState<string | null>(null)
  const lastPricingProductId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(item))
      setActionError(null)
    }
  }, [form, item, open])

  useEffect(() => {
    if (!open) {
      lastPricingProductId.current = undefined
      return
    }

    const hasChangedTarget = lastPricingProductId.current !== pricingProductId
    const savedPrice = pricingQuery.pricing?.accompanimentPrice ?? null
    const initialPrice =
      savedPrice !== null
        ? savedPrice
        : (pricingQuery.pricing?.suggestedAccompanimentPrice ?? null)
    const defaultValue = initialPrice === null ? '' : formatPriceInput(initialPrice)

    if (hasChangedTarget || !form.formState.dirtyFields.accompanimentPrice) {
      form.resetField('accompanimentPrice', { defaultValue })
    }

    lastPricingProductId.current = pricingProductId
  }, [
    form,
    form.formState.dirtyFields.accompanimentPrice,
    open,
    pricingProductId,
    pricingQuery.pricing,
  ])

  const selectedProduct = useMemo(
    () => candidatesQuery.data?.find((candidate) => candidate.id === productIdValue),
    [candidatesQuery.data, productIdValue],
  )
  const types = typesQuery.data?.items ?? []
  const selectedTypeName =
    types.find(({ type }) => type.id === typeId)?.type.name ?? item?.accompanimentTypeName
  const selectedBrand = selectedStockQuery.data?.brands.find(
    ({ brand }) => brand.isPrimary,
  )
  const source = getAccompanimentSource({
    item,
    selectedBrand,
    selectedProduct,
    hasSelectedStock: selectedStockQuery.data !== undefined,
  })
  const numericQuantity = Number(String(quantity ?? '').replace(',', '.'))
  const estimatedCost =
    source?.unitCost !== undefined && numericQuantity > 0
      ? source.unitCost * numericQuantity
      : undefined
  const isRefreshing =
    [candidatesQuery, typesQuery, selectedStockQuery].some(hasRefreshableData) ||
    pricingQuery.isRefreshingPricing
  const isPriceLoading = Boolean(pricingProductId) && pricingQuery.isLoadingPricing
  const selectedStockLoading = !isEdit && selectedStockQuery.isPending
  const selectedStockError = !isEdit && selectedStockQuery.isError
  const savedPrice = pricingQuery.pricing?.accompanimentPrice ?? null

  function handleValueChange(
    name: 'accompanimentProductId' | 'accompanimentTypeId',
    value: string | null,
  ) {
    form.setValue(name, value ?? '', { shouldDirty: true, shouldValidate: true })
    setActionError(null)
  }

  async function handleValidSubmit(values: FormValues) {
    try {
      const input = {
        accompanimentTypeId: values.accompanimentTypeId,
        quantityPerPortion: Number(values.quantityPerPortion.replace(',', '.')),
        ...(savedPrice === null ||
        Number(values.accompanimentPrice.replace(',', '.')) !== savedPrice
          ? { accompanimentPrice: Number(values.accompanimentPrice.replace(',', '.')) }
          : {}),
      }
      if (item) {
        await updateAction.updateProductAccompaniment({ linkId: item.id, input })
      } else {
        await linkAction.linkProductAccompaniment({
          ...input,
          accompanimentProductId: values.accompanimentProductId,
        })
      }
      onSuccess()
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível salvar. Tente novamente.',
      )
    }
  }

  return {
    actionError,
    accompanimentPriceError: pricingQuery.pricingError,
    accompanimentPriceLoading: isPriceLoading,
    accompanimentPriceIsSaved: savedPrice !== null,
    accompanimentPriceSuggestion:
      pricingQuery.pricing?.suggestedAccompanimentPrice ?? null,
    accompanimentPriceSuggestionMode: pricingQuery.pricing?.mode,
    candidates: candidatesQuery.data ?? [],
    candidatesError: !isEdit && candidatesQuery.isError,
    candidatesLoading: !isEdit && candidatesQuery.isPending,
    errors: form.formState.errors,
    estimatedCost,
    handleSubmit: form.handleSubmit(handleValidSubmit),
    handleValueChange,
    isPending: linkAction.isPending || updateAction.isPending,
    isEdit,
    numericQuantity,
    productIdValue,
    selectedProduct,
    retryCandidates: candidatesQuery.refetch,
    retryAccompanimentPrice: pricingQuery.retryPricing,
    retrySelectedStock: selectedStockQuery.refetch,
    selectedStockError,
    selectedStockLoading,
    source,
    selectedTypeName,
    typeId,
    types,
    typesError: typesQuery.isError,
    typesLoading: typesQuery.isPending,
    isRefreshing,
    register: form.register,
    canSave: !pricingProductId || (!pricingQuery.pricingError && !isPriceLoading),
  }
}

function getDefaultValues(item?: ProductAccompanimentDetails): FormValues {
  return {
    accompanimentProductId: item?.accompanimentProductId ?? '',
    accompanimentTypeId: item?.accompanimentTypeId ?? '',
    quantityPerPortion: item ? String(item.quantityPerPortion) : '',
    accompanimentPrice: '',
  }
}

function formatPriceInput(value: number) {
  return value.toFixed(2).replace('.', ',')
}

function getAccompanimentSource({
  hasSelectedStock,
  item,
  selectedBrand,
  selectedProduct,
}: {
  hasSelectedStock: boolean
  item?: Pick<ProductAccompanimentDetails, 'brandName' | 'unitCost'>
  selectedBrand?: { brand: { name: string }; unitPrice?: number }
  selectedProduct?: { currentUnitCost?: number }
}) {
  if (item) return { name: item.brandName, unitCost: item.unitCost }
  if (selectedBrand?.unitPrice !== undefined) {
    return { name: selectedBrand.brand.name, unitCost: selectedBrand.unitPrice }
  }
  if (selectedProduct?.currentUnitCost !== undefined) {
    return {
      name: hasSelectedStock ? 'Estoque único' : undefined,
      unitCost: selectedProduct.currentUnitCost,
    }
  }
  return undefined
}

function hasRefreshableData(query: { data: unknown; isFetching: boolean }) {
  return query.isFetching && query.data != null
}
