export const DiscountsLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando descontos'
    className='space-y-4'
    role='status'
  >
    <div className='h-24 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
    <div className='h-[390px] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
  </div>
)
