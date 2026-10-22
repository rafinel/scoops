import type { UseFormReturn } from 'react-hook-form'

import type { LinkPortionsFormValues } from './use-link-portions-form'

export function useLinkPortionsHandlers(
  form: UseFormReturn<LinkPortionsFormValues>,
  clearActionError: () => void,
) {
  function handleSelectedIdsChange(ids: string[]) {
    form.setValue('portionProductIds', ids, { shouldDirty: true, shouldValidate: true })
    clearActionError()
  }

  function handleTypeChange(value: string | null) {
    form.setValue('accompanimentTypeId', value ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    })
    clearActionError()
  }

  return { handleSelectedIdsChange, handleTypeChange }
}
