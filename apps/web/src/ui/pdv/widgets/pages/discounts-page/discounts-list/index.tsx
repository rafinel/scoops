import type {
  ComboDetails,
  DiscountStatus,
  DiscountType,
} from '@scoops/core/pdv/domain/structures'
import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Pagination } from '@/ui/shared/widgets/components/pagination'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'

import { useDiscountsList } from './use-discounts-list'

export type DiscountsListProps = {
  hasFilters: boolean
  isFetching?: boolean
  onClearFilters: () => void
  onDetails: (discountId: string) => void
  onPageChange: (page: number) => void
  onSearchChange: (search: string) => void
  onStatusChange: (status: DiscountStatus | undefined) => void
  onTypeChange: (type: DiscountType | undefined) => void
  page?: PaginationResponse<ComboDetails>
  search: {
    search?: string
    status?: DiscountStatus
    type?: DiscountType
  }
}

const DISCOUNT_TYPE_LABELS = {
  all: 'Todos',
  combo: 'Combo',
} satisfies Record<'all' | DiscountType, string>

const DISCOUNT_STATUS_LABELS = {
  active: 'Ativo',
  all: 'Todos',
  inactive: 'Inativo',
} satisfies Record<'all' | DiscountStatus, string>

export const DiscountsList = ({
  hasFilters,
  isFetching = false,
  onClearFilters,
  onDetails,
  onPageChange,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  page,
  search,
}: DiscountsListProps) => {
  const formatCurrency = useFormatCurrency()
  const formatDate = useFormatDate()
  const { discounts, firstItem, lastItem, pageCount, pageNumber, pageSize, total } =
    useDiscountsList({ hasFilters, page })

  function renderComposition(details: ComboDetails) {
    const composition = details.components
      .map((item) => {
        const quantityPrefix =
          item.component.quantity > 1 ? `${item.component.quantity}× ` : ''
        return `${quantityPrefix}${item.productName} ${item.configurationName}`.trim()
      })
      .join(' + ')

    return `${details.components.reduce(
      (count, item) => count + item.component.quantity,
      0,
    )} itens · ${composition}`
  }

  function renderStatus(status: DiscountStatus) {
    const isActive = status === 'active'
    return (
      <Badge
        className={
          isActive
            ? 'border-success/30 bg-success-soft text-success'
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
    )
  }

  function renderDetailsLink(discountId: string) {
    return (
      <Anchor
        className='inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-extrabold text-primary hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring/40'
        onClick={(event) => {
          event.preventDefault()
          onDetails(discountId)
        }}
        params={{ discountId }}
        route='discountDetails'
      >
        Detalhes <Icon name='arrow' className='size-4' />
      </Anchor>
    )
  }

  function renderMobileCard(details: ComboDetails) {
    const combo = details.combo
    return (
      <article
        className='grid gap-4 rounded-xl border border-border-soft bg-background p-4'
        key={combo.id}
      >
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <h3 className='truncate text-sm font-extrabold'>{combo.name}</h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              Criado em {formatDate(combo.createdAt, { day: '2-digit', month: 'short' })}
            </p>
          </div>
          {renderStatus(combo.status)}
        </div>
        <dl className='grid gap-3 border-t border-border-soft pt-3 text-sm'>
          <div>
            <dt className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
              Composição
            </dt>
            <dd className='mt-1 text-pretty'>{renderComposition(details)}</dd>
          </div>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <dt className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
                Valor
              </dt>
              <dd className='mt-1 font-extrabold'>{formatCurrency(combo.fixedPrice)}</dd>
            </div>
            {renderDetailsLink(combo.id)}
          </div>
        </dl>
      </article>
    )
  }

  return (
    <Card
      aria-label='Lista de descontos cadastrados'
      className='overflow-hidden rounded-2xl border py-0 shadow-card'
    >
      <CardHeader className='flex flex-col gap-4 border-b border-border-soft p-5 sm:p-6'>
        <div className='flex w-full flex-col gap-4 lg:w-auto lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h2 className='text-lg font-extrabold'>Lista de descontos</h2>
            <p className='mt-1 text-xs font-semibold text-muted-foreground'>
              {total} {total === 1 ? 'desconto' : 'descontos'}
              {isFetching ? ' · Atualizando…' : ''}
            </p>
          </div>
          <div className='flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center'>
            <label
              className='flex min-w-0 flex-1 items-center gap-2 rounded-xl border bg-card px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 lg:min-w-[420px]'
              htmlFor='discount-search'
            >
              <Icon name='search' className='size-4 shrink-0 text-text-tertiary' />
              <Input
                aria-label='Buscar descontos'
                className='h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0'
                id='discount-search'
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder='Buscar por nome do desconto ou produto…'
                value={search.search ?? ''}
              />
            </label>
            <Select
              onValueChange={(value) =>
                onTypeChange(value === 'all' ? undefined : (value as DiscountType))
              }
              value={search.type ?? 'all'}
            >
              <SelectTrigger
                aria-label='Filtrar por tipo'
                className='h-10 w-full lg:w-[128px]'
              >
                <SelectValue>{DISCOUNT_TYPE_LABELS[search.type ?? 'all']}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{DISCOUNT_TYPE_LABELS.all}</SelectItem>
                <SelectItem value='combo'>{DISCOUNT_TYPE_LABELS.combo}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                onStatusChange(value === 'all' ? undefined : (value as DiscountStatus))
              }
              value={search.status ?? 'all'}
            >
              <SelectTrigger
                aria-label='Filtrar por status'
                className='h-10 w-full lg:w-[128px]'
              >
                <SelectValue>
                  {DISCOUNT_STATUS_LABELS[search.status ?? 'all']}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{DISCOUNT_STATUS_LABELS.all}</SelectItem>
                <SelectItem value='active'>{DISCOUNT_STATUS_LABELS.active}</SelectItem>
                <SelectItem value='inactive'>
                  {DISCOUNT_STATUS_LABELS.inactive}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      {discounts.length === 0 ? (
        <CardContent className='grid justify-items-center gap-3 px-5 py-12 text-center sm:px-6'>
          <p className='font-bold'>Nenhum desconto corresponde aos filtros.</p>
          {hasFilters ? (
            <Button onClick={onClearFilters} type='button' variant='outline'>
              Limpar filtros
            </Button>
          ) : null}
        </CardContent>
      ) : (
        <>
          <CardContent className='p-0'>
            <div className='hidden overflow-x-auto lg:block'>
              <table className='w-full min-w-[900px] text-sm'>
                <caption className='sr-only'>Lista de descontos cadastrados</caption>
                <thead className='bg-muted/60'>
                  <tr className='border-b border-border-soft'>
                    <th className='h-11 px-4 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground sm:px-5'>
                      Desconto
                    </th>
                    <th className='h-11 px-4 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground'>
                      Tipo
                    </th>
                    <th className='h-11 px-4 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground'>
                      Composição
                    </th>
                    <th className='h-11 px-4 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground'>
                      Valor
                    </th>
                    <th className='h-11 px-4 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground'>
                      Status
                    </th>
                    <th className='h-11 px-4 text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground sm:px-5'>
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((details) => {
                    const combo = details.combo
                    return (
                      <tr
                        className='border-b border-border-soft last:border-0'
                        key={combo.id}
                      >
                        <td className='px-4 py-4 sm:px-5'>
                          <p className='font-extrabold'>{combo.name}</p>
                          <p className='mt-1 text-xs text-muted-foreground'>
                            Criado em{' '}
                            {formatDate(combo.createdAt, {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </p>
                        </td>
                        <td className='px-4 py-4'>
                          <Badge
                            className='border-primary/30 bg-primary-soft text-primary'
                            variant='secondary'
                          >
                            Combo
                          </Badge>
                        </td>
                        <td className='max-w-[380px] px-4 py-4 text-muted-foreground'>
                          {renderComposition(details)}
                        </td>
                        <td className='px-4 py-4 font-extrabold'>
                          {formatCurrency(combo.fixedPrice)}
                        </td>
                        <td className='px-4 py-4'>{renderStatus(combo.status)}</td>
                        <td className='px-4 py-4 text-right sm:px-5'>
                          {renderDetailsLink(combo.id)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className='grid gap-3 p-4 lg:hidden'>
              {discounts.map(renderMobileCard)}
            </div>
          </CardContent>
          <div className='border-t border-border-soft'>
            {pageCount > 1 ? (
              <Pagination
                currentPage={pageNumber}
                itemLabel='descontos'
                onPageChange={onPageChange}
                pageSize={pageSize}
                totalItems={total}
              />
            ) : (
              <div className='flex items-center justify-between gap-4 px-5 py-4 text-sm text-muted-foreground sm:px-6'>
                <span aria-live='polite'>
                  Mostrando {firstItem}-{lastItem} de {total} descontos
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
