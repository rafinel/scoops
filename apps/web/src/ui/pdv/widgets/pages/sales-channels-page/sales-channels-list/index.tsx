import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelAdjustmentFilter } from '@scoops/validation'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/ui/shadcn/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useFormatDecimal } from '@/ui/shared/hooks/use-format-decimal'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useSalesChannelsList } from './use-sales-channels-list'

export type SalesChannelsListProps = {
  adjustmentFilter: SalesChannelAdjustmentFilter | undefined
  channels: readonly SalesChannel[]
  isReactivatePending?: boolean
  onAdjustmentFilterChange: (filter: SalesChannelAdjustmentFilter | undefined) => void
  onDelete: (channel: SalesChannel) => void
  onEdit: (channel: SalesChannel) => void
  onInactivate: (channel: SalesChannel) => void
  onReactivate: (channel: SalesChannel) => void
}

export const SalesChannelsList = ({
  adjustmentFilter,
  channels,
  isReactivatePending = false,
  onAdjustmentFilterChange,
  onDelete,
  onEdit,
  onInactivate,
  onReactivate,
}: SalesChannelsListProps) => {
  const formatDecimal = useFormatDecimal()
  const { filteredChannels } = useSalesChannelsList(channels, adjustmentFilter)
  const activeCount = filteredChannels.filter(
    (channel) => channel.status === 'active',
  ).length
  const inactiveCount = filteredChannels.length - activeCount

  function formatPercentage(value: number) {
    if (value === 0) return '0%'
    const sign = value > 0 ? '+' : '−'
    return `${sign}${formatDecimal(Math.abs(value))}%`
  }

  function getAdjustmentType(value: number) {
    if (value > 0) return 'Acréscimo'
    if (value < 0) return 'Desconto'
    return 'Neutro'
  }

  function getAdjustmentClass(value: number) {
    if (value > 0) return 'text-warning'
    if (value < 0) return 'text-info'
    return 'text-foreground'
  }

  function getTypeClass(value: number) {
    if (value > 0) return 'bg-warning-soft text-warning'
    if (value < 0) return 'bg-info-soft text-info'
    return 'bg-muted text-muted-foreground'
  }

  function renderStatus(channel: SalesChannel) {
    const isActive = channel.status === 'active'
    return (
      <Badge
        className={
          isActive ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'
        }
        variant='secondary'
      >
        <span
          aria-hidden='true'
          className={`size-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-muted-foreground'}`}
        />
        {isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    )
  }

  function renderActions(channel: SalesChannel) {
    const isActive = channel.status === 'active'
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Abrir ações de ${channel.name}`}
          className='grid size-11 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
        >
          <Icon name='ellipsis' className='size-[18px]' />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-[232px] max-w-[calc(100vw-1.5rem)] rounded-2xl p-2 shadow-dialog'
          sideOffset={8}
        >
          <DropdownMenuItem
            className='min-h-11 gap-3 rounded-xl px-3 py-2 text-sm font-bold'
            onClick={() => onEdit(channel)}
          >
            <Icon name='pencil' className='size-5 text-muted-foreground' />
            Editar canal
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='min-h-11 gap-3 rounded-xl px-3 py-2 text-sm font-bold'
            disabled={isReactivatePending}
            onClick={() => {
              if (isActive) onInactivate(channel)
              else onReactivate(channel)
            }}
          >
            <Icon
              name={isActive ? 'link-off' : 'circle-check'}
              className={`size-5 ${isActive ? 'text-destructive' : 'text-success'}`}
            />
            {isActive ? 'Inativar canal' : 'Reativar canal'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='min-h-11 gap-3 rounded-xl px-3 py-2 text-sm font-bold'
            onClick={() => onDelete(channel)}
            variant='destructive'
          >
            <Icon name='trash-2' className='size-5' />
            Excluir canal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Card
      aria-label='Canais de venda cadastrados'
      className='rounded-2xl border py-0 shadow-none'
    >
      <CardHeader className='flex flex-col gap-4 border-b border-border-soft p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6'>
        <div>
          <h2 className='text-base font-extrabold'>Canais cadastrados</h2>
          <p className='mt-1 text-xs text-muted-foreground'>
            {filteredChannels.length !== channels.length
              ? `${filteredChannels.length} de ${channels.length} canais`
              : `${channels.length} ${channels.length === 1 ? 'canal' : 'canais'}`}{' '}
            · {activeCount} ativos · {inactiveCount}{' '}
            {inactiveCount === 1 ? 'inativo' : 'inativos'}
          </p>
        </div>
        <fieldset className='flex flex-wrap gap-2'>
          <legend className='sr-only'>Filtrar canais por tipo de ajuste</legend>
          <Button
            aria-label='Filtrar acréscimos'
            aria-pressed={adjustmentFilter === 'increase'}
            className='border-warning/20 bg-warning-soft text-warning hover:bg-warning-soft/80 aria-pressed:ring-2 aria-pressed:ring-ring/50 aria-pressed:ring-offset-1'
            onClick={() =>
              onAdjustmentFilterChange(
                adjustmentFilter === 'increase' ? undefined : 'increase',
              )
            }
            size='xs'
            type='button'
            variant='outline'
          >
            + Acréscimo
          </Button>
          <Button
            aria-label='Filtrar descontos'
            aria-pressed={adjustmentFilter === 'discount'}
            className='border-info/20 bg-info-soft text-info hover:bg-info-soft/80 aria-pressed:ring-2 aria-pressed:ring-ring/50 aria-pressed:ring-offset-1'
            onClick={() =>
              onAdjustmentFilterChange(
                adjustmentFilter === 'discount' ? undefined : 'discount',
              )
            }
            size='xs'
            type='button'
            variant='outline'
          >
            − Desconto
          </Button>
          <Button
            aria-label='Filtrar neutros'
            aria-pressed={adjustmentFilter === 'neutral'}
            className='border-border bg-muted text-muted-foreground hover:bg-muted/80 aria-pressed:ring-2 aria-pressed:ring-ring/50 aria-pressed:ring-offset-1'
            onClick={() =>
              onAdjustmentFilterChange(
                adjustmentFilter === 'neutral' ? undefined : 'neutral',
              )
            }
            size='xs'
            type='button'
            variant='outline'
          >
            0 Neutro
          </Button>
        </fieldset>
      </CardHeader>
      <CardContent className='p-0'>
        {filteredChannels.length === 0 ? (
          <div
            aria-live='polite'
            className='grid justify-items-center gap-3 px-5 py-10 text-center sm:px-6'
            role='status'
          >
            <p className='text-sm font-bold'>Nenhum canal corresponde a este filtro.</p>
            <Button
              onClick={() => onAdjustmentFilterChange(undefined)}
              size='sm'
              type='button'
              variant='outline'
            >
              Limpar filtro
            </Button>
          </div>
        ) : (
          <>
            <div className='hidden overflow-x-auto lg:block'>
              <Table className='min-w-[720px]'>
                <caption className='sr-only'>
                  Lista de canais de venda cadastrados
                </caption>
                <TableHeader className='bg-muted/60 [&_tr]:border-0'>
                  <TableRow className='border-0 hover:bg-transparent'>
                    <TableHead className='h-11 px-4 text-xs text-muted-foreground sm:px-5'>
                      Canal
                    </TableHead>
                    <TableHead className='h-11 px-4 text-xs text-muted-foreground'>
                      Ajuste
                    </TableHead>
                    <TableHead className='h-11 px-4 text-xs text-muted-foreground'>
                      Tipo
                    </TableHead>
                    <TableHead className='h-11 px-4 text-xs text-muted-foreground'>
                      Status
                    </TableHead>
                    <TableHead className='h-11 px-4 text-right text-xs text-muted-foreground sm:px-5'>
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChannels.map((channel) => (
                    <TableRow key={channel.id} className='h-[72px]'>
                      <TableCell className='px-4 font-extrabold sm:px-5'>
                        {channel.name}
                      </TableCell>
                      <TableCell
                        className={`px-4 text-sm font-extrabold ${getAdjustmentClass(channel.percentage)}`}
                      >
                        {formatPercentage(channel.percentage)}
                      </TableCell>
                      <TableCell className='px-4'>
                        <Badge
                          className={getTypeClass(channel.percentage)}
                          variant='secondary'
                        >
                          {getAdjustmentType(channel.percentage)}
                        </Badge>
                      </TableCell>
                      <TableCell className='px-4'>{renderStatus(channel)}</TableCell>
                      <TableCell className='px-4 text-right sm:px-5'>
                        <div className='flex justify-end'>{renderActions(channel)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className='grid gap-3 p-4 lg:hidden'>
              {filteredChannels.map((channel) => (
                <article
                  className='grid gap-4 rounded-xl border border-border-soft bg-background p-4'
                  key={channel.id}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <h3 className='truncate text-sm font-extrabold'>{channel.name}</h3>
                      <p
                        className={`mt-1 text-lg font-extrabold ${getAdjustmentClass(channel.percentage)}`}
                      >
                        {formatPercentage(channel.percentage)}
                      </p>
                    </div>
                    {renderActions(channel)}
                  </div>
                  <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3'>
                    <Badge
                      className={getTypeClass(channel.percentage)}
                      variant='secondary'
                    >
                      {getAdjustmentType(channel.percentage)}
                    </Badge>
                    {renderStatus(channel)}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className='gap-2 px-5 py-3 text-xs text-muted-foreground sm:px-6'>
        <Icon name='shield-check' className='size-4 shrink-0' />
        <p>
          Pedidos anteriores preservam o nome e o percentual usados, mesmo após edição ou
          exclusão.
        </p>
      </CardFooter>
    </Card>
  )
}
