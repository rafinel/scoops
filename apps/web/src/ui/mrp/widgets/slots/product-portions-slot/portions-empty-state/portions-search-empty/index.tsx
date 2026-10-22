import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type PortionsSearchEmptyProps = {
  onClearSearch: () => void
  search?: string
}

export const PortionsSearchEmpty = ({
  onClearSearch,
  search,
}: PortionsSearchEmptyProps) => (
  <section
    className='flex flex-col items-center gap-4 rounded-xl border !border-[color:var(--border-soft)] bg-muted px-4 py-8 text-center sm:px-10 sm:py-10'
    role='status'
  >
    <div className='grid size-16 place-items-center rounded-2xl bg-accent text-primary'>
      <Icon className='size-8' name='search-x' />
    </div>
    <h3 className='text-lg leading-[22px] font-extrabold'>Nenhuma porção encontrada</h3>
    <p className='max-w-[420px] text-[13px] leading-4 font-medium text-muted-foreground'>
      Nenhuma porção corresponde a “{search}”.
    </p>
    <Button
      className='h-9 rounded-[10px] px-5 text-[13px] font-bold'
      onClick={onClearSearch}
      type='button'
      variant='outline'
    >
      Limpar busca
    </Button>
  </section>
)
