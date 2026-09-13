import { Skeleton } from '@/ui/shadcn/skeleton'

export const ProductAccompanimentsLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando acompanhamentos'
    className='space-y-4'
    role='status'
  >
    <Skeleton className='h-24 rounded-2xl' />
    <Skeleton className='h-72 rounded-2xl' />
  </div>
)
