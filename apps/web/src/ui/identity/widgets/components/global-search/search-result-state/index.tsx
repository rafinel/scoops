import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type SearchResultStateProps = {
  debouncedQuery: string
  isEmpty: boolean
  isError: boolean
  isLoading: boolean
  onRetry: () => void
}

export const SearchResultState = ({
  debouncedQuery,
  isEmpty,
  isError,
  isLoading,
  onRetry,
}: SearchResultStateProps) => {
  if (isLoading) {
    return (
      <>
        <div className='border-b border-border-soft px-3 pb-2 pt-1 text-xs text-muted-foreground'>
          Buscando resultados
        </div>
        <div
          aria-label='Buscando resultados'
          className='flex min-h-28 items-center gap-3 px-4 py-6'
          role='status'
        >
          <Icon className='size-5 shrink-0 animate-spin text-primary' name='refresh' />
          <div>
            <p className='text-sm font-semibold'>Procurando no Scoops</p>
            <p className='text-xs text-muted-foreground'>
              Os resultados aparecerão aqui.
            </p>
          </div>
        </div>
      </>
    )
  }

  if (isError) {
    return (
      <>
        <div className='border-b border-border-soft px-3 pb-2 pt-1 text-xs text-muted-foreground'>
          Não foi possível buscar
        </div>
        <div className='flex min-h-28 items-center gap-3 px-4 py-6' role='alert'>
          <Icon className='size-4 shrink-0 text-danger' name='triangle-alert' />
          <div className='grid justify-items-start gap-1'>
            <p className='text-sm font-semibold'>A busca falhou</p>
            <Button
              className='h-auto border-0 bg-transparent justify-start px-0 py-0 text-primary hover:bg-transparent'
              onClick={onRetry}
              size='sm'
              type='button'
              variant='link'
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (isEmpty) {
    return (
      <>
        <div className='border-b border-border-soft px-3 pb-2 pt-1 text-xs text-muted-foreground'>
          Nenhum resultado
        </div>
        <div className='flex min-h-28 items-center gap-3 px-4 py-6' role='status'>
          <Icon className='size-4 shrink-0 text-muted-foreground' name='search' />
          <div>
            <p className='text-sm font-semibold'>
              Nenhum resultado para “{debouncedQuery}”
            </p>
            <p className='text-xs text-muted-foreground'>Tente outro termo.</p>
          </div>
        </div>
      </>
    )
  }

  return null
}
