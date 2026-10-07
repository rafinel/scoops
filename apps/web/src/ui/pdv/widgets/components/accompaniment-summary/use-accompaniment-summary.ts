import { groupAccompaniments } from '@/ui/pdv/utils/group-accompaniments'

import type { AccompanimentSummaryProps } from '.'

export function useAccompanimentSummary({ accompaniments }: AccompanimentSummaryProps) {
  return { groups: groupAccompaniments(accompaniments) }
}
