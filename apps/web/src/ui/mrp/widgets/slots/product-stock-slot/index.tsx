import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'

import { ProductBrandsCard } from './product-brands-card'
import { ProductBrandDialog } from './product-brand-dialog'
import { ProductStockSummary } from './product-stock-summary'
import { RemoveProductBrandDialog } from './remove-product-brand-dialog'
import { StockAdjustmentDialog } from './stock-adjustment-dialog'
import { StockTransactionHistoryCard } from './stock-transaction-history-card'
import { useProductStockSlot } from './use-product-stock-slot'

export type ProductStockSlotProps = { productId: string }

export const ProductStockSlot = ({ productId }: ProductStockSlotProps) => {
  const {
    productStock,
    selectedAction,
    isBrandActionPending,
    isError,
    isLoading,
    handleAddBrand,
    handleActionOpenChange,
    handleActionSuccess,
    handleBack,
    handleEntry,
    handleDeleteBrand,
    handleEditBrand,
    handleRetry,
    handleSetPrimaryBrand,
    handleWriteOff,
  } = useProductStockSlot(productId)

  return (
    <ProductDetailsPage
      onBack={handleBack}
      product={productStock?.product}
      selectedTab='stock'
    >
      {isLoading ? <ProductStockLoading /> : null}
      {isError ? <ProductStockError onRetry={handleRetry} /> : null}
      {productStock && !isLoading && !isError ? (
        <>
          <ProductStockSummary
            idealStock={productStock.idealStock}
            stockQuantity={productStock.stockQuantity}
            stockSituation={productStock.stockSituation}
            unit={productStock.product.unit}
          />
          {productStock.product.stockControl === 'single' ? (
            <section className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h2 className='text-lg font-extrabold'>Movimentar estoque</h2>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Registre entradas e baixas em {productStock.product.unit}.
                  </p>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    className='border-green-400 text-green-700'
                    onClick={() => handleEntry()}
                    variant='outline'
                  >
                    <Icon name='arrow-down' /> Entrada
                  </Button>
                  <Button
                    className='border-amber-400 text-amber-700'
                    onClick={() => handleWriteOff()}
                    variant='outline'
                  >
                    <Icon name='arrow-up' /> Baixa
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <ProductBrandsCard
              actionsDisabled={isBrandActionPending}
              brands={productStock.brands}
              onAddBrand={handleAddBrand}
              onDelete={handleDeleteBrand}
              onEdit={handleEditBrand}
              onEntry={handleEntry}
              onSetPrimary={(brand) => void handleSetPrimaryBrand(brand)}
              onWriteOff={handleWriteOff}
              unit={productStock.product.unit}
            />
          )}
          <StockTransactionHistoryCard
            brands={productStock.brands}
            productId={productId}
          />
          <ProductBrandDialog
            brand={
              selectedAction?.kind === 'edit-brand' ? selectedAction.brand : undefined
            }
            onOpenChange={handleActionOpenChange}
            onSuccess={handleActionSuccess}
            open={
              selectedAction?.kind === 'add-brand' ||
              selectedAction?.kind === 'edit-brand'
            }
            productId={productId}
            productName={productStock.product.name}
            unit={productStock.product.unit}
            variant={selectedAction?.kind === 'edit-brand' ? 'edit' : 'add'}
          />
          {selectedAction?.kind === 'delete-brand' ? (
            <RemoveProductBrandDialog
              brand={selectedAction.brand}
              hasSiblingBrands={productStock.brands.length > 1}
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              open
              productId={productId}
            />
          ) : null}
          {selectedAction?.kind === 'entry' || selectedAction?.kind === 'write-off' ? (
            <StockAdjustmentDialog
              allowNegativeStock={productStock.product.allowNegativeStock ?? false}
              brand={selectedAction.brand}
              currentBalance={
                selectedAction.brand?.stockQuantity ?? productStock.stockQuantity
              }
              isOpen
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              productId={productId}
              type={selectedAction.kind}
              unit={productStock.product.unit}
            />
          ) : null}
        </>
      ) : null}
    </ProductDetailsPage>
  )
}

function ProductStockLoading() {
  return (
    <div
      aria-busy='true'
      aria-label='Carregando estoque do produto'
      className='space-y-4'
      role='status'
    >
      <div className='h-40 animate-pulse rounded-2xl bg-muted' />
      <div className='grid gap-4 md:grid-cols-3'>
        <div className='h-28 animate-pulse rounded-2xl bg-muted' />
        <div className='h-28 animate-pulse rounded-2xl bg-muted' />
        <div className='h-28 animate-pulse rounded-2xl bg-muted' />
      </div>
      <div className='h-64 animate-pulse rounded-2xl bg-muted' />
    </div>
  )
}

function ProductStockError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role='alert'
      className='rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center'
    >
      <Icon className='mx-auto size-7 text-destructive' name='triangle-alert' />
      <h1 className='mt-3 text-lg font-extrabold'>Não foi possível carregar o estoque</h1>
      <p className='mt-1 text-sm text-muted-foreground'>
        Verifique sua conexão e tente novamente.
      </p>
      <Button className='mt-4' onClick={onRetry} variant='outline'>
        Tentar novamente
      </Button>
    </div>
  )
}
