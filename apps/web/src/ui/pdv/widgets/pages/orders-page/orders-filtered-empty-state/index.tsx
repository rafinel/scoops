import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrdersFilteredEmptyStateProps = { onClear: () => void }

export const OrdersFilteredEmptyState = ({ onClear }: OrdersFilteredEmptyStateProps) => (
  <section className='grid min-h-[520px] place-items-center rounded-2xl border border-border bg-card p-8 text-center'>
    <div>
      <Icon
        className='mx-auto size-14 rounded-2xl border border-border-soft bg-muted p-3 text-muted-foreground'
        name='search'
      />
      <h2 className='mt-5 text-lg font-extrabold'>Nenhum pedido encontrado</h2>
      <p className='mx-auto mt-2 max-w-md text-sm text-muted-foreground'>
        Não encontramos pedidos com a busca, o canal, o status e o período selecionados.
      </p>
      <Button className='mt-5' onClick={onClear} type='button' variant='outline'>
        <Icon name='x' /> Limpar filtros
      </Button>
    </div>
  </section>
)
