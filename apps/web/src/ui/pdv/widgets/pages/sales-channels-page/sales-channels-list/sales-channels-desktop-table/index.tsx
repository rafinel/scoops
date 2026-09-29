import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelAdjustmentFilter } from '@scoops/validation'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { CardHeader } from '@/ui/shadcn/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'

import { SalesChannelRowActions } from '../sales-channel-row-actions'

export type SalesChannelsDesktopTableProps = {
  adjustmentFilter: SalesChannelAdjustmentFilter | undefined
  canManageSalesChannels: boolean
  channels: readonly SalesChannel[]
  totalChannels: number
  activeCount: number
  inactiveCount: number
  formatPercentage: (value: number) => string
  getAdjustmentClass: (value: number) => string
  getAdjustmentType: (value: number) => string
  getTypeClass: (value: number) => string
  isReactivatePending: boolean
  onAdjustmentFilterChange: (filter: SalesChannelAdjustmentFilter | undefined) => void
  onClearFilter: () => void
  onDelete: (channel: SalesChannel) => void
  onEdit: (channel: SalesChannel) => void
  onInactivate: (channel: SalesChannel) => void
  onReactivate: (channel: SalesChannel) => void
}

export const SalesChannelsDesktopTable = ({
  adjustmentFilter,
  canManageSalesChannels,
  channels,
  totalChannels,
  activeCount,
  inactiveCount,
  formatPercentage,
  getAdjustmentClass,
  getAdjustmentType,
  getTypeClass,
  isReactivatePending,
  onAdjustmentFilterChange,
  onClearFilter,
  onDelete,
  onEdit,
  onInactivate,
  onReactivate,
}: SalesChannelsDesktopTableProps) => (
  <>
    <CardHeader className='flex flex-col gap-4 border-b border-border-soft p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6'>
      <div>
        <h2 className='text-base font-extrabold'>Canais cadastrados</h2>
        <p className='mt-1 text-xs text-muted-foreground'>
          {channels.length !== totalChannels
            ? `${channels.length} de ${totalChannels} canais`
            : `${totalChannels} ${totalChannels === 1 ? 'canal' : 'canais'}`}{' '}
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
    {channels.length === 0 ? (
      <div
        aria-live='polite'
        className='grid justify-items-center gap-3 px-5 py-10 text-center sm:px-6'
        role='status'
      >
        <p className='text-sm font-bold'>Nenhum canal corresponde a este filtro.</p>
        <Button onClick={onClearFilter} size='sm' type='button' variant='outline'>
          Limpar filtro
        </Button>
      </div>
    ) : (
      <div className='hidden overflow-x-auto lg:block'>
        <Table className='min-w-[720px]'>
          <caption className='sr-only'>Lista de canais de venda cadastrados</caption>
          <TableHeader className='bg-muted/60 [&_tr]:border-0'>
            <TableRow className='border-0 hover:bg-transparent'>
              <TableHead className='h-10 px-4 text-xs text-muted-foreground sm:px-5'>
                Canal
              </TableHead>
              <TableHead className='h-10 px-4 text-xs text-muted-foreground'>
                Ajuste
              </TableHead>
              <TableHead className='h-10 px-4 text-xs text-muted-foreground'>
                Tipo
              </TableHead>
              <TableHead className='h-10 px-4 text-xs text-muted-foreground'>
                Status
              </TableHead>
              {canManageSalesChannels ? (
                <TableHead className='h-10 px-4 text-right text-xs text-muted-foreground sm:px-5'>
                  Ações
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((channel) => {
              const isActive = channel.status === 'active'

              return (
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
                  <TableCell className='px-4'>
                    <Badge
                      className={
                        isActive
                          ? 'bg-success-soft text-success'
                          : 'bg-muted text-muted-foreground'
                      }
                      variant='secondary'
                    >
                      <span
                        aria-hidden='true'
                        className={`size-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-muted-foreground'}`}
                      />
                      {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  {canManageSalesChannels ? (
                    <TableCell className='px-4 text-right sm:px-5'>
                      <div className='flex justify-end'>
                        <SalesChannelRowActions
                          channel={channel}
                          isReactivatePending={isReactivatePending}
                          onDelete={() => onDelete(channel)}
                          onEdit={() => onEdit(channel)}
                          onToggleStatus={() =>
                            isActive ? onInactivate(channel) : onReactivate(channel)
                          }
                        />
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )}
  </>
)
