export const ProductAccompanimentsLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando acompanhamentos'
    className='space-y-4'
    role='status'
  >
    <div className='h-24 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
    <div className='h-72 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
  </div>
)
