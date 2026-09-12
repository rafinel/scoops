import { Skeleton } from '@/ui/shadcn/skeleton'

export type ProductsListLoadingProps = Record<string, never>

export const ProductsListLoading = (_props: ProductsListLoadingProps) => {
  return (
    <div
      aria-busy='true'
      aria-label='Carregando produtos'
      className='space-y-3 p-4'
      role='status'
    >
      {['one', 'two', 'three', 'four', 'five'].map((row) => (
        <Skeleton className='h-12 w-full' key={row} />
      ))}
    </div>
  )
}
