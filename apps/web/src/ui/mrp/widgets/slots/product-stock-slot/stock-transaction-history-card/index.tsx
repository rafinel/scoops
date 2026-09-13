import { useState } from 'react'
import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'

import { HistoryFilters } from './history-filters'
import { HistoryHeader } from './history-header'
import { HistoryJustificationDialog } from './history-justification-dialog'
import { HistoryResults } from './history-results'
import { useStockTransactionHistoryCard } from './use-stock-transaction-history-card'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'

export type StockTransactionHistoryCardProps = {
  brands: readonly ProductBrandStock[]
  productId: string
}

export const StockTransactionHistoryCard = ({
  brands,
  productId,
}: StockTransactionHistoryCardProps) => {
  const [selectedJustification, setSelectedJustification] = useState<string | null>(null)
  const formatDate = useFormatDate()
  const history = useStockTransactionHistoryCard(productId, brands)

  return (
    <section className='min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5'>
      <div className='p-4 sm:p-6'>
        <HistoryHeader isRefreshing={history.isRefreshing} />
        <HistoryFilters
          brandId={history.brandId}
          brands={brands}
          from={history.from}
          hasFilters={history.hasFilters}
          onBrandChange={history.handleBrandChange}
          onClearFilters={history.handleClearFilters}
          onFromChange={history.handleFromChange}
          onToChange={history.handleToChange}
          onTypeChange={history.handleTypeChange}
          selectedBrandName={history.selectedBrandName}
          to={history.to}
          type={history.type}
        />
      </div>
      <HistoryResults
        formatDate={formatDate}
        hasFilters={history.hasFilters}
        isError={history.isError}
        isLoading={history.isLoading}
        isPageLoading={history.isPageLoading}
        onJustification={setSelectedJustification}
        onPageChange={history.handlePageChange}
        refetch={history.refetch}
        transactionsPage={history.transactionsPage}
      />
      <HistoryJustificationDialog
        onClose={() => setSelectedJustification(null)}
        selectedJustification={selectedJustification}
      />
    </section>
  )
}
