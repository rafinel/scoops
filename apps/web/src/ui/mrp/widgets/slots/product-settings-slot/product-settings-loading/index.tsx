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
    <div className='h-64 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
    <div className='h-52 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
    <div className='h-44 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
    <div className='h-48 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
  </div>
)
