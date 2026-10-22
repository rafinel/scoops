import { Button } from '@/ui/shadcn/button'

export type PriceLoadErrorProps = {
  onRetry: () => unknown
}

export const PriceLoadError = ({ onRetry }: PriceLoadErrorProps) => (
  <div
    className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
    role='alert'
  >
    <span
      className='text-sm font-semibold text-destructive'
      id='accompaniment-price-read-error'
    >
      Não foi possível carregar o preço do acompanhamento.
    </span>
    <Button
      className='w-fit'
      onClick={() => void onRetry()}
      size='sm'
      type='button'
      variant='outline'
    >
      Tentar novamente
    </Button>
  </div>
)
