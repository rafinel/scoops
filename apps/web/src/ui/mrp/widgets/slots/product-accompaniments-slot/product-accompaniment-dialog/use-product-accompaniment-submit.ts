import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { useLinkProductAccompanimentAction } from '@/ui/mrp/hooks/use-link-product-accompaniment-action'
import { useUpdateProductAccompanimentAction } from '@/ui/mrp/hooks/use-update-product-accompaniment-action'

import type { ProductAccompanimentFormValues } from './use-product-accompaniment-form'

export function useProductAccompanimentSubmit({
  item,
  onSuccess,
  productId,
  savedPrice,
  setActionError,
}: {
  item?: ProductAccompanimentDetails
  onSuccess: () => void
  productId: string
  savedPrice: number | null
  setActionError: (value: string | null) => void
}) {
  const linkAction = useLinkProductAccompanimentAction(productId)
  const updateAction = useUpdateProductAccompanimentAction(productId)

  async function handleValidSubmit(values: ProductAccompanimentFormValues) {
    try {
      await saveProductAccompaniment({
        item,
        linkAction,
        savedPrice,
        updateAction,
        values,
      })
      onSuccess()
    } catch (caught) {
      setActionError(getSubmitError(caught))
    }
  }

  return {
    handleValidSubmit,
    isPending: linkAction.isPending || updateAction.isPending,
  }
}

async function saveProductAccompaniment({
  item,
  linkAction,
  savedPrice,
  updateAction,
  values,
}: {
  item?: ProductAccompanimentDetails
  linkAction: ReturnType<typeof useLinkProductAccompanimentAction>
  savedPrice: number | null
  updateAction: ReturnType<typeof useUpdateProductAccompanimentAction>
  values: ProductAccompanimentFormValues
}) {
  const input = createProductAccompanimentInput(values, savedPrice)
  if (item) {
    await updateAction.updateProductAccompaniment({ linkId: item.id, input })
    return
  }
  await linkAction.linkProductAccompaniment({
    ...input,
    accompanimentProductId: values.accompanimentProductId,
  })
}

function createProductAccompanimentInput(
  values: ProductAccompanimentFormValues,
  savedPrice: number | null,
) {
  const enteredPrice = Number(values.accompanimentPrice.replace(',', '.'))
  return {
    accompanimentTypeId: values.accompanimentTypeId,
    quantityPerPortion: Number(values.quantityPerPortion.replace(',', '.')),
    ...(values.isGlobal ? { isGlobal: true } : {}),
    ...(savedPrice === null || enteredPrice !== savedPrice
      ? { accompanimentPrice: enteredPrice }
      : {}),
  }
}

function getSubmitError(caught: unknown) {
  return caught instanceof Error
    ? caught.message
    : 'Não foi possível salvar. Tente novamente.'
}
