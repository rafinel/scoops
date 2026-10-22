import type { AccompanimentPortionCandidate } from '@scoops/core/mrp/domain/structures'

import { PortionPickerRow } from '../../portion-picker-row'

export type PortionPickerRowsProps = {
  filteredCandidates: readonly AccompanimentPortionCandidate[]
  hasCandidates: boolean
  onToggle: (portionProductId: string, isSelected: boolean) => void
  selectedIdSet: ReadonlySet<string>
}

export const PortionPickerRows = ({
  filteredCandidates,
  hasCandidates,
  onToggle,
  selectedIdSet,
}: PortionPickerRowsProps) => {
  if (!hasCandidates) {
    return (
      <p className='grid h-[120px] place-items-center px-4 text-center text-[13px] font-medium text-muted-foreground'>
        Todas as porções já têm este acompanhamento.
      </p>
    )
  }
  if (filteredCandidates.length === 0) {
    return (
      <p className='px-4 py-6 text-center text-[13px] font-medium text-muted-foreground'>
        Nenhuma porção encontrada.
      </p>
    )
  }
  return (
    <ul>
      {filteredCandidates.map((candidate) => (
        <PortionPickerRow
          candidate={candidate}
          isSelected={selectedIdSet.has(candidate.productId)}
          key={candidate.productId}
          onToggle={onToggle}
        />
      ))}
    </ul>
  )
}
