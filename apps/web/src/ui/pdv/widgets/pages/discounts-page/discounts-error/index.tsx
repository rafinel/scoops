import { Button } from '@/ui/shadcn/button'

export type DiscountsErrorProps = {
  onRetry: () => void
}

export const DiscountsError = ({ onRetry }: DiscountsErrorProps) => (
  <div
    aria-live='assertive'
    className='rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center'
    role='alert'
  >
    <h2 className='text-lg font-extrabold'>Não foi possível carregar os descontos.</h2>
    <p className='mt-1 text-sm text-muted-foreground'>
      Tente novamente para consultar os Combos cadastrados.
    </p>
    <Button className='mt-4' onClick={onRetry} type='button' variant='outline'>
      Tentar novamente
    </Button>
  </div>
)
