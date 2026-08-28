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
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { cn } from '@/ui/shared/lib/utils'

import type { ResaleConfigurationDialogProps } from './use-resale-configuration-dialog'
import { useResaleConfigurationDialog } from './use-resale-configuration-dialog'

export type { ResaleConfigurationDialogProps }

export const ResaleConfigurationDialog = (props: ResaleConfigurationDialogProps) => {
  const formatCurrency = useFormatCurrency()
  const {
    brandId,
    estimatedUnitPrice,
    formError,
    handleBrandChange,
    handleClose,
    handleQuantityChange,
    handleSubmit,
    quantity,
    selectedBrand,
  } = useResaleConfigurationDialog(props)
  const product = props.product
  const hasBrands =
    product?.stockControl === 'by-brand' && Boolean(product.resaleBrands.length)

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      {product ? (
        <DialogContent className='max-h-[min(92vh,866px)] max-w-2xl'>
          <DialogHeader className='border-b border-border-soft p-6 pr-16'>
            <span className='row-span-2 grid size-11 place-items-center rounded-xl bg-info-soft text-info'>
              <Icon name={CATEGORY_ICONS.resale} className='size-6' />
            </span>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              Escolha a marca e a quantidade antes de adicionar.
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[calc(92vh-170px)] space-y-6 overflow-y-auto p-5 sm:p-6'>
            {hasBrands ? (
              <fieldset>
                <legend className='flex w-full items-center justify-between gap-3 text-sm font-extrabold'>
                  <span>1. Escolha a marca e a embalagem</span>
                  <span className='text-xs font-medium text-muted-foreground'>
                    Obrigatório
                  </span>
                </legend>
                <label
                  className='mt-3 flex h-10 items-center gap-3 rounded-lg border px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
                  htmlFor='resale-brand-search'
                >
                  <Icon className='size-4 text-muted-foreground' name='search' />
                  <Input
                    aria-label='Buscar marca'
                    className='h-8 border-0 px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
                    data-focus-ring='delegated'
                    id='resale-brand-search'
                    placeholder='Buscar marca...'
                  />
                </label>
                <div className='mt-3 grid gap-2 sm:grid-cols-3'>
                  {product.resaleBrands.map((brand) => {
                    const isDisabled = !brand.isActive || !brand.isAvailable
                    const isSelected = brand.brandId === brandId
                    return (
                      <Button
                        aria-pressed={isSelected}
                        className={cn(
                          'h-auto min-h-24 flex-col items-start gap-0.5 rounded-xl border p-3 text-left whitespace-normal',
                          isSelected &&
                            'border-info bg-info-soft text-info ring-1 ring-info',
                          isDisabled && 'bg-muted text-muted-foreground opacity-60',
                        )}
                        disabled={isDisabled}
                        key={brand.brandId}
                        onClick={() => handleBrandChange(brand.brandId)}
                        type='button'
                        variant='outline'
                      >
                        <span className='flex w-full items-center justify-between font-extrabold'>
                          {brand.name}
                          {isSelected ? <Icon name='check' /> : null}
                        </span>
                        <span className='text-xs font-medium text-muted-foreground'>
                          Unidade
                        </span>
                        <span className='font-extrabold'>
                          {formatCurrency(brand.basePrice)}
                        </span>
                        <span
                          className={cn(
                            'text-xs',
                            isDisabled ? 'text-danger' : 'text-success',
                          )}
                        >
                          {isDisabled ? 'Sem estoque' : 'Disponível'}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </fieldset>
            ) : null}

            <section
              className='rounded-2xl bg-muted p-4'
              aria-labelledby='resale-quantity-title'
            >
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <h3 className='font-extrabold' id='resale-quantity-title'>
                    {hasBrands ? '2.' : '1.'} Quantidade
                  </h3>
                  <p className='text-xs text-muted-foreground'>
                    {selectedBrand
                      ? `A baixa será feita no estoque da marca ${selectedBrand.name}.`
                      : 'Informe quantas unidades serão adicionadas.'}
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
              className='rounded-2xl bg-info-soft p-4 text-info'
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
