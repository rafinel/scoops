import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type AccompanimentTypesEmptyStateProps = {
  onAdd: () => void
}

export const AccompanimentTypesEmptyState = ({
  onAdd,
}: AccompanimentTypesEmptyStateProps) => (
  <div className='rounded-2xl border border-dashed bg-card p-12 text-center'>
    <Icon className='mx-auto size-8 text-primary' name='tag' />
    <h2 className='mt-3 text-lg font-extrabold'>Nenhum tipo cadastrado</h2>
    <p className='mt-1 text-sm text-muted-foreground'>
      Crie um tipo para organizar os acompanhamentos da sorveteria.
    </p>
    <Button className='mt-5' onClick={onAdd} type='button'>
      <Icon name='plus' /> Novo tipo
    </Button>
  </div>
)
