import { Button } from '@/ui/shadcn/button'

export type PortionPickerHeaderProps = {
  areAllFilteredSelected: boolean
  labelId: string
  onToggleAll: () => void
  showsToggleAll: boolean
}

export const PortionPickerHeader = ({
  areAllFilteredSelected,
  labelId,
  onToggleAll,
  showsToggleAll,
}: PortionPickerHeaderProps) => (
  <div className='flex items-center justify-between gap-3'>
    <span className='text-sm font-bold' id={labelId}>
      Porções
    </span>
    {showsToggleAll ? (
      <Button
        className='h-auto border-0 p-0 text-xs font-semibold'
        onClick={onToggleAll}
        type='button'
        variant='link'
      >
        {areAllFilteredSelected ? 'Limpar seleção' : 'Selecionar todas'}
      </Button>
    ) : null}
  </div>
)
