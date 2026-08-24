import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductSizesEmptyStateProps = {
  onAdd: (target: HTMLElement) => void
}

export const ProductSizesEmptyState = ({ onAdd }: ProductSizesEmptyStateProps) => (
  <div className='rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center'>
    <Icon className='mx-auto size-8 text-muted-foreground' name='tag' />
    <h3 className='mt-3 font-extrabold'>Nenhum tamanho cadastrado</h3>
    <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
      Cadastre o primeiro tamanho para liberar este produto para vendas futuras.
    </p>
    <Button className='mt-5' onClick={(event) => onAdd(event.currentTarget)}>
      <Icon name='plus' /> Adicionar primeiro tamanho
    </Button>
  </div>
)
