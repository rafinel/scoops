export const ProductPricingLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando preços do produto'
    className='space-y-4'
    role='status'
  >
    <div className='h-56 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
    <div className='h-64 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
  </div>
)
