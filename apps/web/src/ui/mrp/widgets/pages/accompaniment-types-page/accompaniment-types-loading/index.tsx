export const AccompanimentTypesLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando tipos de acompanhamento'
    className='space-y-4'
    role='status'
  >
    <div className='h-24 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
    <div className='h-80 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none' />
  </div>
)
