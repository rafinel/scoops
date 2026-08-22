import { useState } from 'react'

import type {
  ProductBrandStock,
  StockAdjustmentType,
  StockTransactionType,
} from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Avatar } from '@/ui/shared/widgets/components/avatar'
import { useFormatDate, useFormatQuantity } from '@/ui/shared/hooks/use-formatters'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Pagination } from '@/ui/shared/widgets/components/pagination'
import { cn } from '@/ui/shared/lib/utils'

import { useStockTransactionsQuery } from '../../../../hooks/use-stock-transactions-query'

const PAGE_SIZE = 5

const TYPE_LABELS: Record<StockTransactionType, string> = {
  entry: 'Entrada Manual',
  'write-off': 'Baixa Manual',
  'production-consumption': 'Consumo de produção',
  'production-output': 'Produção',
}

export type StockTransactionHistoryCardProps = {
  brands: readonly ProductBrandStock[]
  productId: string
}

export const StockTransactionHistoryCard = ({
  brands,
  productId,
}: StockTransactionHistoryCardProps) => {
  const formatDate = useFormatDate()
  const [type, setType] = useState<StockAdjustmentType | ''>('')
  const [brandId, setBrandId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const query = useStockTransactionsQuery(productId, {
    page,
    limit: PAGE_SIZE,
    type: type || undefined,
    brandId: brandId || undefined,
    from: from ? new Date(`${from}T00:00:00.000`) : undefined,
    to: to ? new Date(`${to}T23:59:59.999`) : undefined,
  })
  const hasFilters = Boolean(type || brandId || from || to)
  const selectedBrandName = brands.find(({ brand }) => brand.id === brandId)?.brand.name

  function changeFilter(callback: () => void) {
    callback()
    setPage(1)
  }

  function handleClearFilters() {
    setType('')
    setBrandId('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <section className='min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5'>
      <div className='p-4 sm:p-6'>
        <h2 className='text-lg font-extrabold'>Histórico de Movimentações</h2>
        <div className='mt-4 grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap'>
          <Label className='sr-only' htmlFor='history-type'>
            Tipo
          </Label>
          <Select
            value={type || 'all'}
            onValueChange={(value) =>
              changeFilter(() =>
                setType(value === 'all' ? '' : (value as StockAdjustmentType)),
              )
            }
          >
            <SelectTrigger
              aria-label='Tipo'
              className='h-10 w-full rounded-lg bg-card px-3 text-sm xl:w-auto'
              id='history-type'
            >
              <SelectValue>{type ? TYPE_LABELS[type] : 'Tipo: Todos'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tipo: Todos</SelectItem>
              <SelectItem value='entry'>Entrada Manual</SelectItem>
              <SelectItem value='write-off'>Baixa Manual</SelectItem>
            </SelectContent>
          </Select>
          <Label className='sr-only' htmlFor='history-brand'>
            Marca
          </Label>
          <Select
            value={brandId || 'all'}
            onValueChange={(value) =>
              changeFilter(() =>
                setBrandId(value === 'all' || value === null ? '' : value),
              )
            }
          >
            <SelectTrigger
              aria-label='Marca'
              className='h-10 w-full rounded-lg bg-card px-3 text-sm xl:w-auto'
              id='history-brand'
            >
              <SelectValue>{selectedBrandName ?? 'Marca: Todas'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Marca: Todas</SelectItem>
              {brands.map(({ brand }) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label
            className='grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
            htmlFor='history-from'
          >
            De
            <Input
              id='history-from'
              className='border-0 p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
              data-focus-ring='delegated'
              onChange={(event) => changeFilter(() => setFrom(event.target.value))}
              type='date'
              value={from}
            />
          </label>
          <label
            className='grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
            htmlFor='history-to'
          >
            Até
            <Input
              id='history-to'
              className='border-0 p-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
              data-focus-ring='delegated'
              onChange={(event) => changeFilter(() => setTo(event.target.value))}
              type='date'
              value={to}
            />
          </label>
          {hasFilters ? (
            <Button
              className='justify-start text-muted-foreground'
              onClick={handleClearFilters}
              type='button'
              variant='ghost'
            >
              <Icon name='x' /> Limpar filtros
            </Button>
          ) : null}
        </div>
      </div>

      {query.isPending ? (
        <HistoryStatus icon='clock' isAnimated text='Carregando histórico…' />
      ) : null}
      {query.isError ? (
        <HistoryStatus
          icon='triangle-alert'
          text='Não foi possível carregar o histórico.'
        >
          <Button onClick={() => void query.refetch()} type='button' variant='outline'>
            Tentar novamente
          </Button>
        </HistoryStatus>
      ) : null}
      {query.data && query.data.items.length === 0 ? (
        <HistoryStatus
          icon='clipboard-list'
          text={
            hasFilters
              ? 'Nenhuma movimentação corresponde aos filtros.'
              : 'Nenhuma movimentação registrada.'
          }
        />
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <div className='grid gap-3 px-4 pb-4 lg:hidden'>
            {query.data.items.map((transaction) => (
              <article
                className='rounded-xl border border-border-soft p-4'
                key={transaction.id}
              >
                <div className='flex items-center justify-between gap-3'>
                  <TransactionType type={transaction.type} />
                  <SignedQuantity
                    quantity={transaction.quantity}
                    type={transaction.type}
                    unit={transaction.unit}
                  />
                </div>
                <dl className='mt-3 grid gap-2 text-sm'>
                  <HistoryDetail
                    label='Data/hora'
                    value={formatDate(transaction.occurredAt, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  />
                  <HistoryDetail
                    label='Marca'
                    value={transaction.brandName ?? 'Produto'}
                  />
                </dl>
                <div className='mt-3 flex items-center gap-2 border-t border-border-soft pt-3'>
                  <Avatar
                    className='size-7 text-[10px]'
                    name={transaction.performedByName.normalize('NFC')}
                  />
                  <span className='font-medium'>{transaction.performedByName}</span>
                </div>
              </article>
            ))}
          </div>
          <div className='hidden border-y border-border-soft lg:block'>
            <Table className='min-w-[850px] text-left text-sm'>
              <TableCaption className='sr-only'>
                Movimentações de estoque mais recentes primeiro
              </TableCaption>
              <TableHeader className='bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground'>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='px-4 py-3 font-semibold sm:px-6'>
                    Data/hora
                  </TableHead>
                  <TableHead className='px-4 py-3 font-semibold'>Tipo</TableHead>
                  <TableHead className='px-4 py-3 font-semibold'>Marca</TableHead>
                  <TableHead className='px-4 py-3 font-semibold'>Quantidade</TableHead>
                  <TableHead className='px-4 py-3 font-semibold'>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((transaction) => (
                  <TableRow
                    className='border-b-0 border-t border-border-soft hover:bg-transparent'
                    key={transaction.id}
                  >
                    <TableCell className='px-4 py-4 sm:px-6'>
                      {formatDate(transaction.occurredAt, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      <TransactionType type={transaction.type} />
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      {transaction.brandName ?? 'Produto'}
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      <SignedQuantity
                        quantity={transaction.quantity}
                        type={transaction.type}
                        unit={transaction.unit}
                      />
                    </TableCell>
                    <TableCell className='px-4 py-4'>
                      <div className='flex items-center gap-2'>
                        <Avatar
                          className='size-7 text-[10px]'
                          name={transaction.performedByName.normalize('NFC')}
                        />
                        <span>{transaction.performedByName}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            currentPage={query.data.page}
            itemLabel='movimentações'
            onPageChange={setPage}
            pageSize={query.data.limit}
            totalItems={query.data.total}
          />
        </>
      ) : null}
    </section>
  )
}

function TransactionType({ type }: { type: StockTransactionType }) {
  return (
    <Badge
      className={
        type === 'entry' || type === 'production-output'
          ? 'border border-info/30 bg-info-soft text-info'
          : 'border border-danger/30 bg-danger-soft text-danger'
      }
    >
      {TYPE_LABELS[type]}
    </Badge>
  )
}

function SignedQuantity({
  quantity,
  type,
  unit,
}: {
  quantity: number
  type: StockTransactionType
  unit: string
}) {
  const formatQuantity = useFormatQuantity()
  const isEntry = type === 'entry' || type === 'production-output'
  return (
    <span className={cn('font-extrabold', isEntry ? 'text-success' : 'text-danger')}>
      {isEntry ? '+' : '-'}
      {formatQuantity(quantity, unit)}
    </span>
  )
}

function HistoryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex justify-between gap-3'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='text-right font-medium'>{value}</dd>
    </div>
  )
}

function HistoryStatus({
  children,
  icon,
  isAnimated = false,
  text,
}: {
  children?: React.ReactNode
  icon: 'clipboard-list' | 'clock' | 'triangle-alert'
  isAnimated?: boolean
  text: string
}) {
  return (
    <div
      className='grid min-h-52 place-items-center border-t border-border-soft p-8 text-center'
      role={icon === 'triangle-alert' ? 'alert' : 'status'}
    >
      <div>
        <Icon
          className={cn(
            'mx-auto size-6 text-muted-foreground',
            isAnimated && 'animate-pulse',
          )}
          name={icon}
        />
        <p className='mt-3 text-sm text-muted-foreground'>{text}</p>
        {children ? <div className='mt-4'>{children}</div> : null}
      </div>
    </div>
  )
}
