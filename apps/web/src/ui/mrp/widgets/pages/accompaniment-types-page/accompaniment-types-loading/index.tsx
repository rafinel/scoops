import { Skeleton } from '@/ui/shadcn/skeleton'

export const AccompanimentTypesLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando tipos de acompanhamento'
    className='space-y-4'
    role='status'
  >
    <Skeleton className='h-24 rounded-2xl' />
    <Skeleton className='h-80 rounded-2xl' />
  </div>
)
