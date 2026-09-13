import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductStockErrorProps = {
  onRetry: () => void
}

export const ProductStockError = ({ onRetry }: ProductStockErrorProps) => (
  <div
    role='alert'
    className='rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center'
  >
    <Icon className='mx-auto size-7 text-destructive' name='triangle-alert' />
    <h1 className='mt-3 text-lg font-extrabold'>Não foi possível carregar o estoque</h1>
    <p className='mt-1 text-sm text-muted-foreground'>
      Verifique sua conexão e tente novamente.
    </p>
    <Button className='mt-4' onClick={onRetry} variant='outline'>
      Tentar novamente
    </Button>
  </div>
)
