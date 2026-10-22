import { Button } from '@/ui/shadcn/button'

export type StockLoadErrorProps = {
  onRetry: () => unknown
}

export const StockLoadError = ({ onRetry }: StockLoadErrorProps) => (
  <div
    className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
    role='alert'
  >
    <span className='text-sm font-semibold text-destructive'>
      Não foi possível carregar a marca e o custo atuais.
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
