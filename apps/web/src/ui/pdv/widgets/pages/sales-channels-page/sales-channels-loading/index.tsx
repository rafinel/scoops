export const SalesChannelsLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando canais de venda'
    className='space-y-5'
    role='status'
  >
    <div className='h-20 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
    <div className='h-[330px] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
  </div>
)
