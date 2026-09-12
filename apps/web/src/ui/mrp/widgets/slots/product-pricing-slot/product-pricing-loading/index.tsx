import { Skeleton } from '@/ui/shadcn/skeleton'

export const ProductPricingLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando preços do produto'
    className='space-y-4'
    role='status'
  >
    <Skeleton className='h-56 rounded-2xl' />
    <Skeleton className='h-64 rounded-2xl' />
  </div>
)
