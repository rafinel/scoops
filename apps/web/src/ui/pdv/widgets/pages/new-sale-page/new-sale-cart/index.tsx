import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Button } from '@/ui/shadcn/button'
import { Card } from '@/ui/shadcn/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

import type { NewSaleCartProps } from './use-new-sale-cart'
import { useNewSaleCart } from './use-new-sale-cart'

export type { NewSaleCartProps }

const PERCENTAGE_FORMATTER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export const NewSaleCart = (props: NewSaleCartProps) => {
  const formatCurrency = useFormatCurrency()
  const {
    handleClearConfirmationChange,
    handleConfirmClear,
    handleEditLine,
    handleOpenClearConfirmation,
    handleQuantityChange,
    handleRegister,
    handleRemoveLine,
    isClearConfirmationOpen,
    lineInputs,
    previewCart,
    productsById,
  } = useNewSaleCart(props)
  const selectedChannelId = props.selectedChannelId ?? props.previewCart?.channelId ?? ''
  const selectedChannel = props.channels.find(
    (channel) => channel.id === selectedChannelId,
  )
  const visibleLines = previewCart?.lines ?? lineInputs
  const hasLines = visibleLines.length > 0

  return (
    <Card className='min-w-0 rounded-2xl py-0 shadow-card lg:sticky lg:top-5 lg:flex lg:max-h-[calc(100vh-112px)]'>
      <div className='flex items-center justify-between gap-3 border-b border-border-soft p-5 sm:p-6'>
        <div>
          <h2 className='text-lg font-extrabold'>Pedido atual</h2>
          <p className='text-sm text-muted-foreground'>
            {hasLines
              ? `${lineInputs.length} ${lineInputs.length === 1 ? 'item' : 'itens'} · ${lineInputs.reduce((total, line) => total + line.quantity, 0)} ${lineInputs.reduce((total, line) => total + line.quantity, 0) === 1 ? 'unidade' : 'unidades'}`
              : 'Nenhum item adicionado'}
          </p>
        </div>
        <Button
          aria-label='Limpar pedido'
          className='shrink-0 text-muted-foreground'
          disabled={!hasLines}
          onClick={handleOpenClearConfirmation}
          size='icon'
          type='button'
          variant='outline'
        >
          <Icon name='trash-2' />
        </Button>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto p-5 sm:p-6'>
        <div className='flex items-center justify-between gap-3'>
          <label className='text-sm font-bold' htmlFor='new-sale-channel'>
            Canal de venda
          </label>
          <span className='text-xs text-muted-foreground'>Opcional</span>
        </div>
        <Select
          onValueChange={(value) =>
            props.onChannelChange(value === 'none' || !value ? undefined : value)
          }
          value={selectedChannelId || 'none'}
        >
          <SelectTrigger
            aria-label='Canal de venda'
            className='mt-2 w-full'
            id='new-sale-channel'
          >
            <SelectValue>
              {props.channels.find((channel) => channel.id === selectedChannelId)
                ? `${props.channels.find((channel) => channel.id === selectedChannelId)?.name} · ${PERCENTAGE_FORMATTER.format(props.channels.find((channel) => channel.id === selectedChannelId)?.percentage ?? 0)}%`
                : 'Sem canal'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>Sem canal</SelectItem>
            {props.channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                {channel.name} · {channel.percentage > 0 ? '+' : ''}
                {PERCENTAGE_FORMATTER.format(channel.percentage)}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className='mt-2 text-xs text-muted-foreground'>
          Todos os itens usam o ajuste do canal.
        </p>

        {hasLines ? (
          <div className='mt-5 space-y-3'>
            {visibleLines.map((line) => {
              const product = productsById.get(line.productId)
              const lineWithPrice = previewCart?.lines.find(
                (candidate) => candidate.productId === line.productId,
              )
              const configuration =
                line.kind === 'portion'
                  ? product?.sizes.find((size) => size.sizeId === line.sizeId)?.name
                  : (product?.resaleBrands.find((brand) => brand.brandId === line.brandId)
                      ?.name ?? 'Unidade')
              return (
                <article
                  className='rounded-xl border border-border-soft bg-muted/45 p-3'
                  key={line.productId}
                >
                  <div className='flex items-start gap-3'>
                    <div className='min-w-0 flex-1'>
                      <h3 className='truncate font-extrabold'>
                        {product?.name ?? 'Produto selecionado'}
                      </h3>
                      <p className='truncate text-xs text-muted-foreground'>
                        {configuration ??
                          (line.kind === 'portion' ? 'Porção' : 'Revenda')}
                      </p>
                    </div>
                    <Button
                      aria-label={`Editar ${product?.name ?? 'item'}`}
                      className='size-8'
                      onClick={() => handleEditLine(line)}
                      size='icon'
                      type='button'
                      variant='outline'
                    >
                      <Icon name='pencil' />
                    </Button>
                    <Button
                      aria-label={`Remover ${product?.name ?? 'item'}`}
                      className='size-8 text-danger'
                      onClick={() => handleRemoveLine(line.productId)}
                      size='icon'
                      type='button'
                      variant='outline'
                    >
                      <Icon name='x' />
                    </Button>
                  </div>
                  <div className='mt-3 flex items-center justify-between gap-3'>
                    <div className='flex items-center rounded-lg border bg-card'>
                      <Button
                        aria-label={`Diminuir quantidade de ${product?.name ?? 'item'}`}
                        className='size-8 rounded-r-none border-0'
                        disabled={line.quantity <= 1}
                        onClick={() =>
                          handleQuantityChange(line.productId, line.quantity - 1)
                        }
                        size='icon'
                        type='button'
                        variant='ghost'
                      >
                        <span aria-hidden='true' className='text-lg leading-none'>
                          −
                        </span>
                      </Button>
                      <output
                        aria-label={`Quantidade de ${product?.name ?? 'item'}`}
                        className='min-w-9 text-center text-sm font-extrabold'
                      >
                        {line.quantity}
                      </output>
                      <Button
                        aria-label={`Aumentar quantidade de ${product?.name ?? 'item'}`}
                        className='size-8 rounded-l-none border-0'
                        disabled={line.quantity >= 999}
                        onClick={() =>
                          handleQuantityChange(line.productId, line.quantity + 1)
                        }
                        size='icon'
                        type='button'
                        variant='ghost'
                      >
                        <Icon name='plus' />
                      </Button>
                    </div>
                    <div className='text-right'>
                      {lineWithPrice ? (
                        <>
                          <p className='text-xs text-muted-foreground'>
                            {formatCurrency(lineWithPrice.finalUnitPrice)} cada
                          </p>
                          <p className='font-extrabold'>
                            {formatCurrency(lineWithPrice.subtotal)}
                          </p>
                        </>
                      ) : (
                        <p className='text-xs font-bold text-muted-foreground'>
                          Atualizando valor…
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className='grid min-h-48 place-items-center py-10 text-center'>
            <div>
              <span className='mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary'>
                <Icon name='shopping-cart' />
              </span>
              <p className='mt-3 font-bold'>Seu pedido está vazio.</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Adicione produtos pelo catálogo.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className='border-t border-border-soft p-5 sm:p-6'>
        {props.isPreviewPending ? (
          <p
            aria-live='polite'
            className='mb-3 text-xs font-bold text-muted-foreground'
            role='status'
          >
            Atualizando valores do pedido…
          </p>
        ) : null}
        {previewCart ? (
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between gap-3'>
              <span className='text-muted-foreground'>Subtotal</span>
              <strong>{formatCurrency(previewCart.subtotal)}</strong>
            </div>
            {selectedChannel ? (
              <div className='flex justify-between gap-3 text-primary'>
                <span>
                  {selectedChannel.name} · {selectedChannel.percentage > 0 ? '+' : ''}
                  {PERCENTAGE_FORMATTER.format(selectedChannel.percentage)}%
                </span>
                <strong>Aplicado</strong>
              </div>
            ) : null}
            {previewCart.discounts.map((discount) => (
              <div
                className='flex items-center justify-between gap-3 rounded-lg bg-success-soft px-3 py-2 text-xs font-bold text-success'
                key={discount.discountId}
              >
                <span className='min-w-0 truncate'>{discount.name}</span>
                <span>− {formatCurrency(discount.savings)}</span>
              </div>
            ))}
            <div className='mt-3 flex items-center justify-between gap-3 border-t border-border-soft pt-3'>
              <span className='text-base font-extrabold'>Total</span>
              <strong className='text-2xl font-black'>
                {formatCurrency(previewCart.total)}
              </strong>
            </div>
          </div>
        ) : null}
        <Button
          className='mt-4 w-full shadow-primary'
          disabled={!props.canRegister || props.isPreviewPending}
          onClick={handleRegister}
          type='button'
        >
          <Icon name='plus' /> Registrar pedido
        </Button>
      </div>

      <AlertDialog
        open={isClearConfirmationOpen}
        onOpenChange={handleClearConfirmationChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader className='border-b border-border-soft p-5 pr-14'>
            <AlertDialogMedia className='bg-danger-soft text-danger'>
              <Icon name='trash-2' />
            </AlertDialogMedia>
            <AlertDialogTitle>Limpar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os produtos selecionados serão removidos do pedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='bg-danger text-white hover:bg-danger/80'
              onClick={handleConfirmClear}
            >
              Limpar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
