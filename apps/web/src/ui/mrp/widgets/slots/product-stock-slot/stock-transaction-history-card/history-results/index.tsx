import type { StockTransactionPage } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Pagination } from '@/ui/shared/widgets/components/pagination'

import { HistoryDesktopTransactions } from '../history-desktop-transactions'
import { HistoryLoading } from '../history-loading'
import { HistoryMobileTransactions } from '../history-mobile-transactions'
import { HistoryStatus } from '../history-status'

export type HistoryResultsProps = {
  formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string
  hasFilters: boolean
  isError: boolean
  isLoading: boolean
  isPageLoading: boolean
  onJustification: (justification: string) => void
  onPageChange: (page: number) => void
  refetch: () => unknown
  transactionsPage: StockTransactionPage | undefined
}

export const HistoryResults = ({
  formatDate,
  hasFilters,
  isError,
  isLoading,
  isPageLoading,
  onJustification,
  onPageChange,
  refetch,
  transactionsPage,
}: HistoryResultsProps) => (
  <>
    {isLoading ? <HistoryLoading /> : null}
    {isError ? (
      <HistoryStatus icon='triangle-alert' text='Não foi possível carregar o histórico.'>
        <Button onClick={() => void refetch()} type='button' variant='outline'>
          Tentar novamente
        </Button>
      </HistoryStatus>
    ) : null}
    {transactionsPage && transactionsPage.items.length === 0 ? (
      <HistoryStatus
        icon='clipboard-list'
        text={
          hasFilters
            ? 'Nenhuma movimentação corresponde aos filtros.'
            : 'Nenhuma movimentação registrada.'
        }
      />
    ) : null}
    {transactionsPage && transactionsPage.items.length > 0 ? (
      <>
        <HistoryMobileTransactions
          formatDate={formatDate}
          onJustification={onJustification}
          transactions={transactionsPage.items}
        />
        <HistoryDesktopTransactions
          formatDate={formatDate}
          onJustification={onJustification}
          transactions={transactionsPage.items}
        />
        <Pagination
          currentPage={transactionsPage.page}
          isLoading={isPageLoading}
          itemLabel='movimentações'
          onPageChange={onPageChange}
          pageSize={transactionsPage.limit}
          totalItems={transactionsPage.total}
        />
      </>
    ) : null}
  </>
)
