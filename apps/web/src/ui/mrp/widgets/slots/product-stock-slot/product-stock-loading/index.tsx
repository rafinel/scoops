import { Skeleton } from '@/ui/shadcn/skeleton'

export const ProductStockLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando estoque do produto'
    className='space-y-4'
    role='status'
  >
    <div className='grid gap-4 md:grid-cols-3'>
      {['one', 'two', 'three'].map((card) => (
        <Skeleton className='h-28 rounded-2xl' key={card} />
      ))}
    </div>
    <Skeleton className='h-40 rounded-2xl' />
    <Skeleton className='h-64 rounded-2xl' />
  </div>
)
