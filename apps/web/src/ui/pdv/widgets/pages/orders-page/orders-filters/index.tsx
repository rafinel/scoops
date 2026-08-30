import { OrderStatus } from '@scoops/core/pdv/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { type OrdersFiltersProps, useOrdersFilters } from './use-orders-filters'

export type { OrdersFiltersProps }

export const OrdersFilters = (props: OrdersFiltersProps) => {
  const {
    handleChannelChange,
    handleFromChange,
    handlePeriodChange,
    handleStatusChange,
    handleToChange,
    searchValue,
    setSearchValue,
  } = useOrdersFilters(props)
  const { channels, isLoadingChannels, onClear, search } = props

  return (
    <div className='grid gap-2 md:grid-cols-2 xl:flex xl:flex-wrap'>
      <Label className='flex h-11 min-w-0 items-center gap-2 rounded-xl border bg-card px-3.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 xl:min-w-[330px] xl:flex-1'>
        <Icon className='size-4 shrink-0 text-muted-foreground' name='search' />
        <Input
          aria-label='Buscar pedidos'
          className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:border-0 focus-visible:ring-0'
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder='Buscar por número ou produto'
          value={searchValue}
        />
      </Label>
      <Select
        onValueChange={handleChannelChange}
        value={search.channelId === undefined ? 'all' : search.channelId}
      >
        <SelectTrigger
          aria-label='Filtrar por canal'
          className='h-11 rounded-xl px-3.5 xl:w-[170px]'
        >
          <SelectValue>
            {search.channelId === undefined
              ? 'Todos os canais'
              : search.channelId === 'none'
                ? 'Sem canal'
                : (channels.find((channel) => channel.id === search.channelId)?.name ??
                  'Canal')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Todos os canais</SelectItem>
          <SelectItem value='none'>Sem canal</SelectItem>
          {channels.map((channel) => (
            <SelectItem disabled={isLoadingChannels} key={channel.id} value={channel.id}>
              {channel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={handleStatusChange} value={search.status ?? 'all'}>
        <SelectTrigger
          aria-label='Filtrar por status'
          className='h-11 rounded-xl px-3.5 xl:w-[155px]'
        >
          <SelectValue>
            {search.status === OrderStatus.Registered
              ? 'Registrado'
              : search.status === OrderStatus.Canceled
                ? 'Cancelado'
                : 'Todos os status'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Todos os status</SelectItem>
          <SelectItem value={OrderStatus.Registered}>Registrado</SelectItem>
          <SelectItem value={OrderStatus.Canceled}>Cancelado</SelectItem>
        </SelectContent>
      </Select>
      <Select onValueChange={handlePeriodChange} value={search.period}>
        <SelectTrigger
          aria-label='Filtrar por período'
          className='h-11 rounded-xl px-3.5 xl:w-[175px]'
        >
          <SelectValue>
            {search.period === 'custom' ? 'Período personalizado' : 'Últimos 30 dias'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='last-30-days'>Últimos 30 dias</SelectItem>
          <SelectItem value='custom'>Período personalizado</SelectItem>
        </SelectContent>
      </Select>
      {search.period === 'custom' ? (
        <div className='grid grid-cols-2 gap-2 md:col-span-2 xl:contents'>
          <Label className='flex h-11 items-center gap-2 rounded-xl border px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <span className='text-xs font-bold text-muted-foreground'>De</span>
            <Input
              aria-label='Data inicial'
              className='h-auto min-w-0 flex-1 border-0 p-0 shadow-none focus-visible:border-0 focus-visible:ring-0'
              data-focus-ring='delegated'
              onChange={(event) => handleFromChange(event.target.value)}
              type='date'
              value={search.from ?? ''}
            />
          </Label>
          <Label className='flex h-11 items-center gap-2 rounded-xl border px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <span className='text-xs font-bold text-muted-foreground'>Até</span>
            <Input
              aria-label='Data final'
              className='h-auto min-w-0 flex-1 border-0 p-0 shadow-none focus-visible:border-0 focus-visible:ring-0'
              data-focus-ring='delegated'
              onChange={(event) => handleToChange(event.target.value)}
              type='date'
              value={search.to ?? ''}
            />
          </Label>
        </div>
      ) : null}
      {props.search.search ||
      props.search.channelId ||
      props.search.status ||
      props.search.period === 'custom' ? (
        <Button
          className='justify-start text-muted-foreground'
          onClick={onClear}
          type='button'
          variant='ghost'
        >
          <Icon name='x' /> Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}
