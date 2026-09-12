import { Skeleton } from '@/ui/shadcn/skeleton'

export type HistoryLoadingProps = Record<string, never>

export const HistoryLoading = (_props: HistoryLoadingProps) => (
  <div
    aria-busy='true'
    aria-label='Carregando histórico de movimentações'
    className='space-y-3 p-4'
    role='status'
  >
    {['one', 'two', 'three', 'four'].map((row) => (
      <Skeleton className='h-12 w-full' key={row} />
    ))}
  </div>
)
