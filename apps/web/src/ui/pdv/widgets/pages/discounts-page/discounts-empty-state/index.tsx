import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DiscountsEmptyStateProps = {
  onCreate: () => void
}

export const DiscountsEmptyState = ({ onCreate }: DiscountsEmptyStateProps) => (
  <div className='rounded-2xl border border-dashed bg-card px-6 py-14 text-center shadow-card sm:px-12'>
    <Icon className='mx-auto size-9 text-primary' name='tags' />
    <h2 className='mt-3 text-lg font-extrabold'>Nenhum desconto cadastrado</h2>
    <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
      Crie um Combo para oferecer uma combinação especial de produtos no PDV.
    </p>
    <Button className='mt-5 shadow-primary' onClick={onCreate} type='button'>
      <Icon name='plus' /> Criar primeiro desconto
    </Button>
  </div>
)
