import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/ui/shadcn/alert'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { NewSaleCatalog } from './new-sale-catalog'
import { NewSaleCart } from './new-sale-cart'
import { OrderConfirmation } from './order-confirmation'
import { OrderRegistrationDialog } from './order-registration-dialog'
import { OrderVerificationState } from './order-verification-state'
import { PortionConfigurationDialog } from './portion-configuration-dialog'
import { ResaleConfigurationDialog } from './resale-configuration-dialog'
import { useNewSalePage } from './use-new-sale-page'

export const NewSalePage = () => {
  const {
    activeSalesChannels,
    catalogProducts,
    channelId,
    editingLine,
    handleChannelChange,
    handleClear,
    handleConfirmRegistration,
    handleDialogOpenChange,
    handleEditLine,
    handleFeedbackAction,
    handleNewSale,
    handleRefreshPreview,
    handleRegister,
    handleRemoveLine,
    handleQuantityChange,
    handleRetryRegistration,
    handleSaveLine,
    handleSelectProduct,
    isActiveSalesChannelsError,
    isLoadingActiveSalesChannels,
    isPreviewPending,
    isRegistrationOpen,
    isRegistrationPending,
    isVerification,
    lineInputs,
    previewCart,
    previewError,
    previewToken,
    registeredOrder,
    registrationError,
    registrationFeedback,
    registrationResult,
    selectedProduct,
  } = useNewSalePage()

  if (registeredOrder) {
    return <OrderConfirmation onNewSale={handleNewSale} order={registeredOrder} />
  }

  return (
    <>
      <section aria-labelledby='new-sale-title' className='min-w-0'>
        <div className='mb-7 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-black tracking-tight' id='new-sale-title'>
              Nova venda
            </h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Selecione os produtos e revise o pedido antes de registrar.
            </p>
          </div>
          <span className='inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-extrabold text-primary'>
            <Icon name='shopping-cart' /> Venda em andamento
          </span>
        </div>

        {isActiveSalesChannelsError ? (
          <Alert className='mb-4' variant='destructive'>
            <Icon name='triangle-alert' />
            <AlertTitle>Canais de venda indisponíveis</AlertTitle>
            <AlertDescription>
              O pedido pode continuar sem canal de venda.
            </AlertDescription>
          </Alert>
        ) : null}
        {previewError ? (
          <Alert className='mb-4' variant='destructive'>
            <Icon name='triangle-alert' />
            <AlertTitle>Não foi possível atualizar os valores</AlertTitle>
            <AlertDescription>
              <span>{previewError}</span>{' '}
              <Button
                className='h-auto p-0 font-bold'
                onClick={handleRefreshPreview}
                type='button'
                variant='link'
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {registrationError ? (
          <Alert className='mb-4' variant='destructive'>
            <Icon name='triangle-alert' />
            <AlertTitle>Não foi possível registrar o pedido</AlertTitle>
            <AlertDescription>
              <span>{registrationError}</span>{' '}
              <Button
                className='h-auto p-0 font-bold'
                onClick={handleRetryRegistration}
                type='button'
                variant='link'
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className='grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_390px]'>
          <NewSaleCatalog
            addedProductIds={lineInputs.map((line) => line.productId)}
            onSelectProduct={handleSelectProduct}
          />
          <NewSaleCart
            canRegister={Boolean(previewCart && previewToken)}
            channels={activeSalesChannels}
            isPreviewPending={isPreviewPending || isLoadingActiveSalesChannels}
            lineInputs={lineInputs}
            onChannelChange={handleChannelChange}
            onClear={handleClear}
            onEditLine={handleEditLine}
            onQuantityChange={handleQuantityChange}
            onRegister={handleRegister}
            onRemoveLine={handleRemoveLine}
            previewCart={previewCart}
            products={catalogProducts}
            selectedChannelId={channelId}
          />
        </div>
      </section>

      <PortionConfigurationDialog
        initialLine={editingLine}
        isOpen={selectedProduct?.kind === 'portion'}
        onOpenChange={handleDialogOpenChange}
        onSave={handleSaveLine}
        product={selectedProduct?.kind === 'portion' ? selectedProduct : undefined}
        salesChannel={activeSalesChannels.find((channel) => channel.id === channelId)}
      />
      <ResaleConfigurationDialog
        initialLine={editingLine}
        isOpen={selectedProduct?.kind === 'resale'}
        onOpenChange={handleDialogOpenChange}
        onSave={handleSaveLine}
        product={selectedProduct?.kind === 'resale' ? selectedProduct : undefined}
        salesChannel={activeSalesChannels.find((channel) => channel.id === channelId)}
      />
      {!isVerification ? (
        <OrderRegistrationDialog
          cart={previewCart}
          isOpen={isRegistrationOpen}
          isPending={isRegistrationPending}
          onConfirm={handleConfirmRegistration}
          onOpenChange={(open) => {
            if (!open) handleFeedbackAction()
          }}
        />
      ) : null}

      {registrationResult?.kind === 'repriced' ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) handleFeedbackAction()
          }}
        >
          <DialogContent className='max-w-xl'>
            <DialogHeader className='border-b border-border-soft p-6 pr-16'>
              <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-info-soft text-info'>
                <Icon name='arrow-down-up' className='size-6' />
              </span>
              <DialogTitle>O pedido foi atualizado</DialogTitle>
              <DialogDescription>
                Alguns valores mudaram antes do registro. Confira o novo total.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-3 p-6'>
              {registrationResult.changes.map((change) => (
                <div
                  className='rounded-xl bg-info-soft p-4 text-sm text-info'
                  key={`${change.kind}-${change.previous.label}-${change.current.label}-${change.previous.amount}-${change.current.amount}`}
                >
                  <p className='text-xs font-extrabold uppercase'>Pedido atualizado</p>
                  <p className='mt-1 font-extrabold'>
                    {change.current.label}:{' '}
                    {change.current.amount !== change.previous.amount
                      ? 'valor recalculado'
                      : 'as condições atuais foram aplicadas'}
                  </p>
                  <p className='mt-1 text-xs'>
                    O pedido ainda não foi registrado. Confirme os novos valores antes de
                    continuar.
                  </p>
                </div>
              ))}
              <p className='text-sm text-muted-foreground'>
                Novo total:{' '}
                <strong className='text-foreground'>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(registrationResult.recalculatedCart.total)}
                </strong>
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleFeedbackAction} type='button'>
                <Icon name='arrow-left' /> Revisar valores
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {registrationResult?.kind === 'review-required' ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) handleFeedbackAction()
          }}
        >
          <DialogContent className='max-w-xl'>
            <DialogHeader className='border-b border-border-soft p-6 pr-16'>
              <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-warning-soft text-warning'>
                <Icon name='triangle-alert' className='size-6' />
              </span>
              <DialogTitle>Revise o pedido</DialogTitle>
              <DialogDescription>
                Algumas condições mudaram enquanto você montava o pedido.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-3 p-6'>
              {registrationResult.shortages.map((shortage) => (
                <div
                  className='rounded-xl border border-warning bg-warning-soft p-4 text-sm'
                  key={`${shortage.productId}-${shortage.brandId ?? 'product'}`}
                >
                  <p className='text-xs font-extrabold uppercase text-warning'>
                    Estoque insuficiente
                  </p>
                  <p className='mt-1 font-extrabold'>
                    {shortage.productName}
                    {shortage.brandName ? ` · ${shortage.brandName}` : ''} não possui
                    saldo suficiente
                  </p>
                  <p className='mt-1 text-xs text-warning'>
                    Necessário: {shortage.requiredQuantity} {shortage.unit} · Disponível:{' '}
                    {shortage.availableQuantity} {shortage.unit}
                  </p>
                </div>
              ))}
              <p className='text-sm text-muted-foreground'>
                O pedido não foi registrado. Revise os itens destacados e tente novamente.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleFeedbackAction} type='button'>
                <Icon name='arrow-left' /> Revisar pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {registrationResult?.kind === 'correction-required' ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) handleFeedbackAction()
          }}
        >
          <DialogContent className='max-w-xl'>
            <DialogHeader className='border-b border-border-soft p-6 pr-16'>
              <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-danger-soft text-danger'>
                <Icon name='triangle-alert' className='size-6' />
              </span>
              <DialogTitle>Corrija o pedido</DialogTitle>
              <DialogDescription>
                Alguns itens precisam de atenção antes que o pedido possa ser registrado.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-3 p-6'>
              {registrationResult.invalidConfigurations.map((invalid) => (
                <div
                  className='rounded-xl bg-danger-soft p-4 text-sm text-danger'
                  key={`${invalid.productId}-${invalid.selectedId}`}
                >
                  <p className='text-xs font-extrabold uppercase'>Ação necessária</p>
                  <p className='mt-1 font-extrabold'>{invalid.productName}</p>
                  <p className='mt-1 text-xs'>{invalid.correctiveMessage}</p>
                </div>
              ))}
              {registrationResult.shortages.map((shortage) => (
                <div
                  className='rounded-xl bg-danger-soft p-4 text-sm text-danger'
                  key={`${shortage.productId}-${shortage.brandId ?? 'product'}`}
                >
                  <p className='text-xs font-extrabold uppercase'>Ação necessária</p>
                  <p className='mt-1 font-extrabold'>
                    {shortage.productName} não possui saldo suficiente
                  </p>
                  <p className='mt-1 text-xs'>
                    Necessário: {shortage.requiredQuantity} {shortage.unit} · Disponível:{' '}
                    {shortage.availableQuantity} {shortage.unit}
                  </p>
                </div>
              ))}
              <p className='text-sm text-muted-foreground'>
                O pedido não foi registrado. Suas escolhas foram preservadas.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleFeedbackAction} type='button'>
                <Icon name='arrow-left' /> Revisar itens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {registrationFeedback === 'invalid-token' ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) handleFeedbackAction()
          }}
        >
          <DialogContent className='max-w-md'>
            <DialogHeader className='border-b border-border-soft p-6 pr-16'>
              <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-danger-soft text-danger'>
                <Icon name='link-off' className='size-6' />
              </span>
              <DialogTitle>Atualize a prévia</DialogTitle>
              <DialogDescription>
                A prévia do pedido expirou ou não é válida. Atualize os valores para
                continuar.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleRefreshPreview} type='button'>
                Atualizar prévia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {registrationFeedback === 'rollback' ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) handleFeedbackAction()
          }}
        >
          <DialogContent className='max-w-lg'>
            <DialogHeader className='border-b border-border-soft p-6 pr-16'>
              <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-danger-soft text-danger'>
                <Icon name='shield-alert' className='size-6' />
              </span>
              <DialogTitle>Não foi possível registrar</DialogTitle>
              <DialogDescription>
                A conexão foi interrompida durante o processamento.
              </DialogDescription>
            </DialogHeader>
            <div className='p-6'>
              <div className='flex items-start gap-3 rounded-xl border bg-success-soft p-3 text-sm text-success'>
                <Icon className='mt-0.5 size-5 shrink-0' name='shield-check' />
                <div>
                  <p className='font-extrabold'>Nenhuma alteração foi realizada</p>
                  <p className='text-xs'>
                    O pedido não foi criado e nenhum estoque foi baixado.
                  </p>
                </div>
              </div>
              <p className='mt-4 text-sm text-muted-foreground'>
                Verifique sua conexão e tente novamente. O carrinho foi preservado.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleFeedbackAction} type='button' variant='outline'>
                Voltar ao pedido
              </Button>
              <Button onClick={handleRetryRegistration} type='button'>
                <Icon name='arrow-down-up' /> Tentar novamente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      <OrderVerificationState isVisible={isVerification} />
    </>
  )
}
