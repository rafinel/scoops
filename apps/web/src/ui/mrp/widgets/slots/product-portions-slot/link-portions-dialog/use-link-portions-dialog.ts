import { getLinkPortionsFields } from './link-portions-fields'
import { useLinkPortionsForm } from './use-link-portions-form'
import { useLinkPortionsHandlers } from './use-link-portions-handlers'
import { useLinkPortionsQueries } from './use-link-portions-queries'
import { useLinkPortionsSubmit } from './use-link-portions-submit'

export type UseLinkPortionsDialogProps = {
  onBecameGlobal: () => void
  onSuccess: () => void
  open: boolean
  productId: string
}

export function useLinkPortionsDialog({
  onBecameGlobal,
  onSuccess,
  open,
  productId,
}: UseLinkPortionsDialogProps) {
  const queries = useLinkPortionsQueries(productId, open)
  const formState = useLinkPortionsForm(open, queries.pricingQuery.pricing)
  const savedPrice = queries.pricingQuery.pricing?.accompanimentPrice ?? null
  const { actionError, clearActionError, ...submit } = useLinkPortionsSubmit({
    ...queries,
    form: formState.form,
    onBecameGlobal,
    onSuccess,
    productId,
  })

  return {
    ...getLinkPortionsFields(queries, formState, savedPrice),
    actionError,
    isPending: submit.isPending,
    ...useLinkPortionsHandlers(formState.form, clearActionError),
    handleSubmit: submit.handleSubmit,
  }
}

export type LinkPortionsDialogState = ReturnType<typeof useLinkPortionsDialog>
