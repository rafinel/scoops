import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type RecipeEmptyStateProps = { canAdd: boolean; onAdd: () => void }
export const RecipeEmptyState = ({ canAdd, onAdd }: RecipeEmptyStateProps) => (
  <div className='grid min-h-64 place-items-center rounded-2xl border bg-muted/60 p-8 text-center'>
    <div>
      <span className='mx-auto grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary'>
        <Icon name='chef-hat' />
      </span>
      <h3 className='mt-4 text-lg font-extrabold'>Comece a montar sua receita</h3>
      <p className='mx-auto mt-2 max-w-sm text-sm text-muted-foreground'>
        Adicione os ingredientes com quantidade proporcional ao rendimento. Enquanto não
        houver receita, a produção fica bloqueada.
      </p>
      <Button className='mt-5' disabled={!canAdd} onClick={onAdd}>
        <Icon name='plus' /> Adicionar primeiro ingrediente
      </Button>
    </div>
  </div>
)
