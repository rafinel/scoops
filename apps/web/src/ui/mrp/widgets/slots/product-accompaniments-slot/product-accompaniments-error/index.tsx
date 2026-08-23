import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ProductAccompanimentsErrorProps = {
  onRetry: () => void
}

export const ProductAccompanimentsError = ({
  onRetry,
}: ProductAccompanimentsErrorProps) => (
  <div
    className='rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center'
    role='alert'
  >
    <Icon className='mx-auto size-7 text-destructive' name='triangle-alert' />
    <h1 className='mt-3 text-lg font-extrabold'>
      Não foi possível carregar os acompanhamentos
    </h1>
    <p className='mt-1 text-sm text-muted-foreground'>
      Tente novamente para consultar os vínculos.
    </p>
    <Button className='mt-4' onClick={onRetry} type='button' variant='outline'>
      Tentar novamente
    </Button>
  </div>
)
