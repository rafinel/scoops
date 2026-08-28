import { ProductUnit } from '@scoops/core/mrp/domain/structures'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { CATEGORY_ICONS } from '@/constants/product-category-icons'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { cn } from '@/ui/shared/lib/utils'

import type { PortionConfigurationDialogProps } from './use-portion-configuration-dialog'
import { usePortionConfigurationDialog } from './use-portion-configuration-dialog'

export type { PortionConfigurationDialogProps }

export const PortionConfigurationDialog = (props: PortionConfigurationDialogProps) => {
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  const {
    accompanimentIds,
    estimatedUnitPrice,
    formError,
    handleAccompanimentChange,
    handleClose,
    handleQuantityChange,
    handleSizeChange,
    handleSubmit,
    quantity,
    selectedSize,
    sizeId,
  } = usePortionConfigurationDialog(props)
  const product = props.product

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      {product ? (
        <DialogContent className='max-h-[min(92vh,966px)] sm:!max-w-2xl'>
          <DialogHeader className='border-b border-border-soft p-6 pr-16'>
            <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-accent text-primary'>
              <Icon name={CATEGORY_ICONS.portion} className='size-6' />
            </span>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              Configure a porção antes de adicioná-la ao pedido.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[calc(92vh-170px)] space-y-6 overflow-y-auto p-5 sm:p-6'>
            <fieldset>
              <legend className='flex w-full items-center justify-between gap-3 text-sm font-extrabold'>
                <span>1. Escolha o tamanho</span>
                <span className='text-xs font-medium text-muted-foreground'>
                  Obrigatório
                </span>
              </legend>
              <div className='mt-3 grid gap-2 sm:grid-cols-3'>
                {product.sizes.map((size) => {
                  const isDisabled = !size.isActive || !size.isAvailable
                  const isSelected = size.sizeId === sizeId
                  return (
                    <Button
                      aria-pressed={isSelected}
                      className={cn(
                        'h-auto min-h-20 flex-col items-start gap-0.5 rounded-xl border p-3 text-left whitespace-normal',
                        isSelected &&
                          'border-primary bg-accent text-primary ring-1 ring-primary',
                        isDisabled && 'bg-muted text-muted-foreground opacity-60',
                      )}
                      disabled={isDisabled}
                      key={size.sizeId}
                      onClick={() => handleSizeChange(size)}
                      type='button'
                      variant='outline'
                    >
                      <span className='flex w-full items-center justify-between font-extrabold'>
                        {size.name}
                        {isSelected ? <Icon name='check' /> : null}
                      </span>
                      <span className='text-xs font-medium text-muted-foreground'>
                        {formatQuantity(
                          size.quantity,
                          product.unit ?? ProductUnit.Kilogram,
                        )}
                      </span>
                      <span className='font-extrabold'>
                        {formatCurrency(size.basePrice)}
                      </span>
                      {isDisabled ? (
                        <span className='text-xs text-danger'>Indisponível</span>
                      ) : null}
                    </Button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className='flex w-full items-center justify-between gap-3 text-sm font-extrabold'>
                <span>2. Escolha os acompanhamentos</span>
                <span className='text-xs font-medium text-muted-foreground'>
                  Opcional · múltipla escolha
                </span>
              </legend>
              <div className='mt-3 grid gap-2 sm:grid-cols-2'>
                {(selectedSize?.accompaniments ?? []).map((accompaniment) => {
                  const isDisabled = !accompaniment.isActive || !accompaniment.isAvailable
                  const isSelected = accompanimentIds.includes(
                    accompaniment.accompanimentId,
                  )
                  return (
                    <label
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-bold',
                        isSelected && 'border-primary bg-accent text-primary',
                        isDisabled && 'bg-muted text-muted-foreground opacity-60',
                      )}
                      htmlFor={`portion-accompaniment-${accompaniment.accompanimentId}`}
                      key={accompaniment.accompanimentId}
                    >
                      <Checkbox
                        aria-label={accompaniment.name}
                        checked={isSelected}
                        disabled={isDisabled}
                        id={`portion-accompaniment-${accompaniment.accompanimentId}`}
                        onCheckedChange={(checked) =>
                          handleAccompanimentChange(
                            accompaniment.accompanimentId,
                            checked === true,
                          )
                        }
                      />
                      <span className='min-w-0 flex-1 truncate'>
                        {accompaniment.name}
                      </span>
                      <span className='shrink-0 text-xs font-bold'>
                        {isDisabled
                          ? 'Sem estoque'
                          : accompaniment.basePrice === 0
                            ? 'Grátis'
                            : `+ ${formatCurrency(accompaniment.basePrice)}`}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <section
              className='rounded-2xl bg-muted p-4'
              aria-labelledby='portion-quantity-title'
            >
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <h3 className='font-extrabold' id='portion-quantity-title'>
                    3. Quantidade
                  </h3>
                  <p className='text-xs text-muted-foreground'>
                    Informe quantas porções serão adicionadas.
                  </p>
                </div>
                <div className='flex h-10 items-center rounded-lg border bg-card'>
                  <Button
                    aria-label='Diminuir quantidade'
                    className='size-10 rounded-none'
                    disabled={quantity <= 1}
                    onClick={() => handleQuantityChange(quantity - 1)}
                    size='icon'
                    type='button'
                    variant='ghost'
                  >
                    <span aria-hidden='true'>−</span>
                  </Button>
                  <output
                    aria-label='Quantidade'
                    className='min-w-8 text-center font-extrabold'
                  >
                    {quantity}
                  </output>
                  <Button
                    aria-label='Aumentar quantidade'
                    className='size-10 rounded-none'
                    disabled={quantity >= 999}
                    onClick={() => handleQuantityChange(quantity + 1)}
                    size='icon'
                    type='button'
                    variant='ghost'
                  >
                    <Icon name='plus' />
                  </Button>
                </div>
              </div>
            </section>

            <section
              className='rounded-2xl bg-accent p-4 text-primary'
              aria-label='Preço'
            >
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-wide'>Preço</p>
                </div>
                <p className='text-2xl font-black'>
                  {formatCurrency(estimatedUnitPrice * quantity)}
                </p>
              </div>
            </section>
            {formError ? (
              <p className='text-sm font-bold text-danger' role='alert'>
                {formError}
              </p>
            ) : null}
          </div>
          <DialogFooter className='sm:flex-row sm:justify-end'>
            <Button onClick={handleClose} type='button' variant='outline'>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} type='button'>
              <Icon name='shopping-cart' /> Adicionar ao carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
