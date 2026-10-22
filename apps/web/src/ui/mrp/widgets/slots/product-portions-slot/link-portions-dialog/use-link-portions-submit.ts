import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type {
  AccompanimentPortionCandidate,
  LinkAccompanimentPortionsInput,
} from '@scoops/core/mrp/domain/structures'
import { ConflictError } from '@scoops/core/shared/domain/errors'

import { useLinkAccompanimentPortionsAction } from '@/ui/mrp/hooks/use-link-accompaniment-portions-action'

import type { LinkPortionsFormValues } from './use-link-portions-form'
import type { LinkPortionsQueries } from './use-link-portions-queries'

const GENERIC_ERROR_MESSAGE = 'Não foi possível vincular. Tente novamente.'

export type UseLinkPortionsSubmitProps = {
  candidatesQuery: LinkPortionsQueries['candidatesQuery']
  form: UseFormReturn<LinkPortionsFormValues>
  globalQuery: LinkPortionsQueries['globalQuery']
  onBecameGlobal: () => void
  onSuccess: () => void
  productId: string
}

export function useLinkPortionsSubmit(props: UseLinkPortionsSubmitProps) {
  const linkAction = useLinkAccompanimentPortionsAction(props.productId)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleValidSubmit(values: LinkPortionsFormValues) {
    setActionError(null)
    try {
      await linkAction.linkAccompanimentPortions(createInput(values))
      props.onSuccess()
    } catch (caught) {
      handleRejection(await recoverFromRejection(caught, props))
    }
  }

  function handleRejection(message: string | null) {
    if (message === null) props.onBecameGlobal()
    else setActionError(message)
  }

  return {
    actionError,
    isPending: linkAction.isPending,
    clearActionError: () => setActionError(null),
    handleSubmit: props.form.handleSubmit(handleValidSubmit),
  }
}

// Returns the message to show, or null when the Accompaniment became global while the
// dialog was open (the slot explains it, so the server text is not shown).
async function recoverFromRejection(
  caught: unknown,
  { candidatesQuery, form, globalQuery }: UseLinkPortionsSubmitProps,
) {
  if (await hasBecomeGlobal(caught, globalQuery)) return null
  const refreshed = await candidatesQuery.refetch()
  pruneSelection(form, refreshed.data ?? [])
  return caught instanceof Error ? caught.message : GENERIC_ERROR_MESSAGE
}

function pruneSelection(
  form: UseFormReturn<LinkPortionsFormValues>,
  freshCandidates: readonly AccompanimentPortionCandidate[],
) {
  const eligibleIds = new Set(freshCandidates.map((candidate) => candidate.productId))
  const current = form.getValues('portionProductIds')
  form.setValue(
    'portionProductIds',
    current.filter((id) => eligibleIds.has(id)),
    { shouldDirty: true },
  )
}

// A conflict is told apart by re-reading the global state: when the Accompaniment became
// global while the dialog was open, the server text is not shown (the slot explains it).
async function hasBecomeGlobal(
  caught: unknown,
  globalQuery: UseLinkPortionsSubmitProps['globalQuery'],
) {
  if (!(caught instanceof ConflictError)) return false
  const refreshedGlobal = await globalQuery.refetch()
  return refreshedGlobal.data?.isGlobal === true
}

function createInput(values: LinkPortionsFormValues): LinkAccompanimentPortionsInput {
  return {
    portionProductIds: values.portionProductIds,
    accompanimentTypeId: values.accompanimentTypeId,
    quantityPerPortion: Number(values.quantityPerPortion.replace(',', '.')),
    accompanimentPrice: Number(values.accompanimentPrice.replace(',', '.')),
  }
}
