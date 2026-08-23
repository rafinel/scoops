import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type AccompanimentsEmptyStateProps = {
  onAdd: () => void
}

export const AccompanimentsEmptyState = ({ onAdd }: AccompanimentsEmptyStateProps) => (
  <div className='rounded-2xl border border-dashed bg-card p-12 text-center'>
    <Icon className='mx-auto size-8 text-primary' name='layers' />
    <h2 className='mt-3 text-lg font-extrabold'>Nenhum acompanhamento vinculado</h2>
    <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
      Vincule um acompanhamento para disponibilizá-lo junto a este produto no PDV.
    </p>
    <div className='mt-5 flex flex-wrap justify-center gap-2'>
      <Button onClick={onAdd} type='button'>
        <Icon name='plus' /> Vincular acompanhamento
      </Button>
    </div>
  </div>
)
