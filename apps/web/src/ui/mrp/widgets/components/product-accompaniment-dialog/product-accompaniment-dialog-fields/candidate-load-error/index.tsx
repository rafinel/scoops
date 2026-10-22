import { Button } from '@/ui/shadcn/button'

export type CandidateLoadErrorProps = {
  onRetry: () => unknown
}

export const CandidateLoadError = ({ onRetry }: CandidateLoadErrorProps) => (
  <div
    className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
    role='alert'
  >
    <span className='text-sm font-semibold text-destructive'>
      Não foi possível carregar os acompanhamentos.
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
