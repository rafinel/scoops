import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { PageRefreshStatus } from '@/ui/pdv/widgets/pages/query-refresh-status'

import { DiscountTypeDialog } from './discount-type-dialog'
import { DiscountsEmptyState } from './discounts-empty-state'
import { DiscountsError } from './discounts-error'
import { DiscountsList } from './discounts-list'
import { DiscountsLoading } from './discounts-loading'
import { useDiscountsPage } from './use-discounts-page'

export const DiscountsPage = () => {
  const {
    canManageDiscounts,
    discountsPage,
    hasFilters,
    isDiscountsError,
    isLoadingDiscounts,
    isPageLoadingDiscounts,
    isRefreshingDiscounts,
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
            {canManageDiscounts
              ? 'Crie e acompanhe ofertas aplicadas no PDV.'
              : 'Consulte as ofertas de desconto aplicadas no PDV.'}
          </p>
        </div>
        {canManageDiscounts ? (
          <Button className='min-h-10 shrink-0' onClick={handleCreate}>
            <Icon name='plus' />
            Criar desconto
          </Button>
        ) : null}
      </header>

      <PageRefreshStatus
        isRefreshing={isRefreshingDiscounts}
        label='Atualizando descontos…'
      />

      {isLoadingDiscounts ? <DiscountsLoading /> : null}
      {!isLoadingDiscounts && isDiscountsError ? (
        <DiscountsError onRetry={handleRetry} />
      ) : null}
      {!isLoadingDiscounts && !isDiscountsError && isEmpty ? (
        canManageDiscounts ? (
          <DiscountsEmptyState onCreate={handleCreate} />
        ) : (
          <section
            className='rounded-2xl border border-dashed p-12 text-center'
            role='status'
          >
            <h2 className='text-lg font-extrabold'>Nenhum desconto cadastrado</h2>
            <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
              Os descontos cadastrados pela sua equipe aparecerão aqui.
            </p>
          </section>
        )
      ) : null}
      {!isLoadingDiscounts && !isDiscountsError && !isEmpty ? (
        <DiscountsList
          hasFilters={hasFilters}
          onClearFilters={handleClearFilters}
          onDetails={handleDetails}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onTypeChange={handleTypeChange}
          page={discountsPage}
          isPageLoading={isPageLoadingDiscounts}
          search={search}
        />
      ) : null}

      {canManageDiscounts ? (
        <DiscountTypeDialog
          onChoose={handleChooseCombo}
          onOpenChange={handleTypeDialogOpenChange}
          open={isTypeDialogOpen}
        />
      ) : null}
    </section>
  )
}
