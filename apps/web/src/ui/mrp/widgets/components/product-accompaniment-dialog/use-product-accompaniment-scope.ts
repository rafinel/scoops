import { useMemo } from 'react'

import {
  buildProductAccompanimentScope,
  type ProductAccompanimentScopeInput,
} from './product-accompaniment-dialog-scope'

export function useProductAccompanimentScope({
  accompaniment,
  hasIndividualLinks,
  mode,
  portionName,
}: ProductAccompanimentScopeInput) {
  return useMemo(
    () =>
      buildProductAccompanimentScope({
        accompaniment,
        hasIndividualLinks,
        mode,
        portionName,
      }),
    [accompaniment, hasIndividualLinks, mode, portionName],
  )
}
