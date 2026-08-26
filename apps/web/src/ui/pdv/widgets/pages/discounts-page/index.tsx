import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { DiscountTypeDialog } from './discount-type-dialog'
import { DiscountsEmptyState } from './discounts-empty-state'
import { DiscountsError } from './discounts-error'
import { DiscountsList } from './discounts-list'
import { DiscountsLoading } from './discounts-loading'
import { useDiscountsPage } from './use-discounts-page'

export const DiscountsPage = () => {
  const {
    discountsPage,
    hasFilters,
    isDiscountsError,
    isFetchingDiscounts,
    isLoadingDiscounts,
    isTypeDialogOpen,
    search,
    handleClearFilters,
    handleChooseCombo,
    handleCreate,
    handleDetails,
    handlePageChange,
    handleRetry,
    handleSearchChange,
    handleStatusChange,
    handleTypeChange,
    handleTypeDialogOpenChange,
  } = useDiscountsPage()

  const isEmpty = discountsPage?.total === 0 && !hasFilters

  return (
    <section className='min-w-0 space-y-5'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl'>
            Descontos
          </h1>
          <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
            Crie e acompanhe ofertas aplicadas no PDV.
          </p>
        </div>
        <Button className='min-h-11 shrink-0' onClick={handleCreate}>
          <Icon name='plus' />
          Criar desconto
        </Button>
      </header>

      <div aria-live='polite' className='sr-only'>
        {isFetchingDiscounts ? 'Atualizando descontos.' : ''}
      </div>

      {isLoadingDiscounts ? <DiscountsLoading /> : null}
      {!isLoadingDiscounts && isDiscountsError ? (
        <DiscountsError onRetry={handleRetry} />
      ) : null}
      {!isLoadingDiscounts && !isDiscountsError && isEmpty ? (
        <DiscountsEmptyState onCreate={handleCreate} />
      ) : null}
      {!isLoadingDiscounts && !isDiscountsError && !isEmpty ? (
        <DiscountsList
          hasFilters={hasFilters}
          isFetching={isFetchingDiscounts}
          onClearFilters={handleClearFilters}
          onDetails={handleDetails}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onTypeChange={handleTypeChange}
          page={discountsPage}
          search={search}
        />
      ) : null}

      <DiscountTypeDialog
        onChoose={handleChooseCombo}
        onOpenChange={handleTypeDialogOpenChange}
        open={isTypeDialogOpen}
      />
    </section>
  )
}
