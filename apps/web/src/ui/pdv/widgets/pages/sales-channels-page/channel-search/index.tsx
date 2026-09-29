import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

export const ChannelSearch = ({
  searchFilter,
  onSearchFilterChange,
}: {
  searchFilter?: string
  onSearchFilterChange: (filter: string | undefined) => void
}) => (
  <>
    <Card className='gap-0 rounded-2xl border py-0 shadow-none'>
      <CardContent className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name='calculator' className='size-5' />
          </span>
          <div className='min-w-0'>
            <h2 className='text-sm font-extrabold'>O canal é opcional</h2>
            <p className='mt-1 text-sm text-muted-foreground'>
              Sem canal, o pedido mantém os preços-base. O percentual escolhido vale para
              todos os itens pagos.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <div className='flex flex-wrap items-end gap-3'>
      <label
        className='grid min-w-0 flex-1 gap-1.5 text-sm font-semibold'
        htmlFor='sales-channel-search'
      >
        Buscar canal
        <input
          className='h-10 min-w-0 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20'
          id='sales-channel-search'
          onChange={(event) =>
            onSearchFilterChange(event.currentTarget.value || undefined)
          }
          placeholder='Nome do canal'
          value={searchFilter ?? ''}
        />
      </label>
      {searchFilter ? (
        <Button
          onClick={() => onSearchFilterChange(undefined)}
          type='button'
          variant='outline'
        >
          Limpar busca
        </Button>
      ) : null}
    </div>
  </>
)
