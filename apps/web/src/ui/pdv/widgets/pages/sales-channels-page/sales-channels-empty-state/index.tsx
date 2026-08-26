import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type SalesChannelsEmptyStateProps = {
  onAdd: () => void
}

export const SalesChannelsEmptyState = ({ onAdd }: SalesChannelsEmptyStateProps) => (
  <section
    aria-label='Canais cadastrados'
    className='rounded-2xl border border-dashed bg-card p-12 text-center'
  >
    <span className='mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary'>
      <Icon name='store' className='size-6' />
    </span>
    <h2 className='mt-4 text-lg font-extrabold'>Nenhum canal cadastrado</h2>
    <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
      Crie um canal para ajustar os preços de vendas por contexto.
    </p>
    <Button className='mt-5 shadow-primary' onClick={onAdd} type='button'>
      <Icon name='plus' /> Novo canal
    </Button>
  </section>
)
