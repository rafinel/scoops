import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { useLinkAccompanimentPortionsAction } from '@/ui/mrp/hooks/use-link-accompaniment-portions-action'
import { useLinkProductAccompanimentAction } from '@/ui/mrp/hooks/use-link-product-accompaniment-action'
import { useUpdateGlobalAccompanimentAction } from '@/ui/mrp/hooks/use-update-global-accompaniment-action'
import { useUpdateProductAccompanimentAction } from '@/ui/mrp/hooks/use-update-product-accompaniment-action'

import type { ProductAccompanimentDialogScope } from './product-accompaniment-dialog-scope'
import type { ProductAccompanimentFormValues } from './use-product-accompaniment-form'

type SubmitActions = {
  linkAction: ReturnType<typeof useLinkProductAccompanimentAction>
  linkPortionsAction: ReturnType<typeof useLinkAccompanimentPortionsAction>
  updateAction: ReturnType<typeof useUpdateProductAccompanimentAction>
  updateGlobalAction: ReturnType<typeof useUpdateGlobalAccompanimentAction>
}

export function useProductAccompanimentSubmit({
  item,
  onSuccess,
  productId,
  baselinePrice,
  scope,
  setActionError,
}: {
  item?: ProductAccompanimentDetails
  onSuccess: () => void
  productId: string
  baselinePrice: number | null
  scope: ProductAccompanimentDialogScope
  setActionError: (value: string | null) => void
}) {
  const linkAction = useLinkProductAccompanimentAction(productId)
  const linkPortionsAction = useLinkAccompanimentPortionsAction(productId)
  const updateAction = useUpdateProductAccompanimentAction(productId)
  const updateGlobalAction = useUpdateGlobalAccompanimentAction(productId)

  async function handleValidSubmit(values: ProductAccompanimentFormValues) {
    try {
      await saveProductAccompaniment({
        actions: { linkAction, linkPortionsAction, updateAction, updateGlobalAction },
        item,
        baselinePrice,
        scope,
        values,
      })
      onSuccess()
    } catch (caught) {
      setActionError(getSubmitError(caught))
    }
  }

  return {
    handleValidSubmit,
    isPending:
      linkAction.isPending ||
      linkPortionsAction.isPending ||
      updateAction.isPending ||
      updateGlobalAction.isPending,
  }
}

async function saveProductAccompaniment({
  actions,
  item,
  baselinePrice,
  scope,
  values,
}: {
  actions: SubmitActions
  item?: ProductAccompanimentDetails
  baselinePrice: number | null
  scope: ProductAccompanimentDialogScope
  values: ProductAccompanimentFormValues
}) {
  const sharedInput = createSharedInput(values, baselinePrice)
  if (scope.kind === 'global') {
    await actions.updateGlobalAction.updateGlobalAccompaniment(sharedInput)
    return
  }
  if (scope.kind === 'make-global') {
    await actions.linkPortionsAction.linkAccompanimentPortions({
      ...sharedInput,
      isGlobal: true,
    })
    return
  }
  const input = {
    ...sharedInput,
    ...(values.isGlobal ? { isGlobal: true } : {}),
  }
  if (item) {
    await actions.updateAction.updateProductAccompaniment({ linkId: item.id, input })
    return
  }
  await actions.linkAction.linkProductAccompaniment({
    ...input,
    accompanimentProductId: values.accompanimentProductId,
  })
}

function createSharedInput(
  values: ProductAccompanimentFormValues,
  baselinePrice: number | null,
) {
  const enteredPrice = Number(values.accompanimentPrice.replace(',', '.'))
  return {
    accompanimentTypeId: values.accompanimentTypeId,
    quantityPerPortion: Number(values.quantityPerPortion.replace(',', '.')),
    ...(baselinePrice === null || enteredPrice !== baselinePrice
      ? { accompanimentPrice: enteredPrice }
      : {}),
  }
}

function getSubmitError(caught: unknown) {
  return caught instanceof Error
    ? caught.message
    : 'Não foi possível salvar. Tente novamente.'
}
