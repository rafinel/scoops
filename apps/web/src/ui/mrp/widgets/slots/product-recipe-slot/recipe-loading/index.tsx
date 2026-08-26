export const RecipeLoading = () => (
  <div
    aria-busy='true'
    aria-label='Carregando receita'
    className='space-y-4'
    role='status'
  >
    <div className='h-36 animate-pulse rounded-2xl bg-muted' />
    <div className='h-96 animate-pulse rounded-2xl bg-muted' />
  </div>
)
