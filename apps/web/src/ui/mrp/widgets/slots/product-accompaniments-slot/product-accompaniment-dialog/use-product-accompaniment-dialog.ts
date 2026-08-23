import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { z } from 'zod'

import { productAccompanimentFormSchema } from '@scoops/validation'
import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { useAccompanimentCandidatesQuery } from '@/ui/mrp/hooks/use-accompaniment-candidates-query'
import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useLinkProductAccompanimentAction } from '@/ui/mrp/hooks/use-link-product-accompaniment-action'
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
  const candidatesQuery = useAccompanimentCandidatesQuery(productId, open && !isEdit)
  const typesQuery = useAccompanimentTypesQuery({ page: 1, pageSize: 100 })
  const selectedStockQuery = useProductStockQuery(isEdit ? '' : productIdValue)
  const linkAction = useLinkProductAccompanimentAction(productId)
  const updateAction = useUpdateProductAccompanimentAction(productId)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(item))
      setActionError(null)
    }
  }, [form, item, open])

  const selectedProduct = useMemo(
    () => candidatesQuery.data?.find((candidate) => candidate.id === productIdValue),
    [candidatesQuery.data, productIdValue],
  )
  const selectedBrand = selectedStockQuery.data?.brands.find(
    ({ brand }) => brand.isPrimary,
  )
  const source = item
    ? { name: item.brandName, unitCost: item.unitCost }
    : selectedBrand?.unitPrice !== undefined
      ? {
          name: selectedBrand.brand.name,
          unitCost: selectedBrand.unitPrice,
        }
      : selectedProduct?.currentUnitCost !== undefined
        ? {
            name: selectedStockQuery.data ? 'Estoque único' : undefined,
            unitCost: selectedProduct.currentUnitCost,
          }
        : undefined
  const numericQuantity = Number(String(quantity ?? '').replace(',', '.'))
  const estimatedCost =
    source?.unitCost !== undefined && numericQuantity > 0
      ? source.unitCost * numericQuantity
      : undefined

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
    candidates: candidatesQuery.data ?? [],
    candidatesError: candidatesQuery.isError,
    candidatesLoading: candidatesQuery.isPending,
    errors: form.formState.errors,
    estimatedCost,
    handleSubmit: form.handleSubmit(handleValidSubmit),
    handleValueChange,
    isPending: linkAction.isPending || updateAction.isPending,
    isEdit,
    productIdValue,
    selectedProduct,
    retryCandidates: candidatesQuery.refetch,
    retrySelectedStock: selectedStockQuery.refetch,
    selectedStockError: selectedStockQuery.isError,
    selectedStockLoading: selectedStockQuery.isPending,
    source,
    typeId,
    types: typesQuery.data?.items ?? [],
    typesError: typesQuery.isError,
    typesLoading: typesQuery.isPending,
    register: form.register,
  }
}

function getDefaultValues(item?: ProductAccompanimentDetails): FormValues {
  return {
    accompanimentProductId: item?.accompanimentProductId ?? '',
    accompanimentTypeId: item?.accompanimentTypeId ?? '',
    quantityPerPortion: item ? String(item.quantityPerPortion) : '',
  }
}
