import { Skeleton } from '@/ui/shadcn/skeleton'

export type ProductSettingsLoadingProps = {
  className?: string
}

export const ProductSettingsLoading = ({ className }: ProductSettingsLoadingProps) => (
  <div
    aria-busy='true'
    aria-label='Carregando configurações do produto'
    className={`grid gap-5 ${className ?? ''}`}
    role='status'
  >
    <Skeleton className='h-64 rounded-2xl' />
    <Skeleton className='h-52 rounded-2xl' />
    <Skeleton className='h-44 rounded-2xl' />
    <Skeleton className='h-48 rounded-2xl' />
  </div>
)
