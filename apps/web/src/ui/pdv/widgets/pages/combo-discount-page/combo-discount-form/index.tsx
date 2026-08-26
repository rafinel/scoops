import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ComboProductDialog, type ComboProductDetails } from '../combo-product-dialog'
import {
  useComboDiscountForm,
  type ComboDiscountFormProps,
} from './use-combo-discount-form'
import { RemoveComboProductDialog } from './remove-combo-product-dialog'

export type {
  ComboDiscountFormInput,
  ComboDiscountFormMode,
  ComboDiscountFormValues,
} from './use-combo-discount-form'
export type { ComboDiscountFormProps }

export const ComboDiscountForm = (props: ComboDiscountFormProps) => {
  const {
    addProductButtonRef,
    componentDetails,
    componentPendingRemoval,
    errors,
    fixedPriceNumber,
    formatCurrency,
    isProductDialogOpen,
    isRemoveProductDialogOpen,
    isSubmitDisabled,
    normalPrice,
    savings,
    status,
    submitError,
    handleAddComponent,
    handleCancel,
    handleConfirmRemoveComponent,
    handleOpenProductDialog,
    handleProductDialogOpenChange,
    handleQuantityChange,
    handleRemoveProductDialogOpenChange,
    handleRequestRemoveComponent,
    handleStatusChange,
    handleSubmit,
    resolveRemoveProductFinalFocus,
    register,
  } = useComboDiscountForm(props)
  const productIds = componentDetails.map((details) => details.component.productId)

  function componentLabel(details: ComboProductDetails) {
    const accompaniments =
      details.accompanimentNames.length > 0
        ? ` · ${details.accompanimentNames.join(', ')}`
        : ''
    return `${details.productName} · ${details.configurationName}${accompaniments}`
  }

  return (
    <>
      <form className='space-y-5' noValidate onSubmit={handleSubmit}>
        <Card className='rounded-2xl shadow-card'>
          <CardHeader className='border-b border-border-soft p-5 sm:p-6'>
            <h2 className='text-lg font-extrabold'>Informações básicas</h2>
            <p className='text-sm text-muted-foreground'>
              Defina como o Combo será apresentado no PDV.
            </p>
          </CardHeader>
          <CardContent className='grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6'>
            <div>
              <Label htmlFor='combo-name'>Nome do combo</Label>
              <Input
                aria-describedby={errors.name ? 'combo-name-error' : undefined}
                aria-invalid={Boolean(errors.name)}
                className='mt-2'
                id='combo-name'
                placeholder='Ex.: Combo Açaí + Brownie'
                {...register('name')}
              />
              {errors.name ? (
                <p
                  className='mt-1 text-sm font-semibold text-destructive'
                  id='combo-name-error'
                >
                  {errors.name.message}
                </p>
              ) : null}
            </div>
            <div className='flex items-start justify-between gap-4 rounded-xl border border-border-soft bg-muted/30 p-4 sm:min-w-48'>
              <div>
                <p className='text-sm font-extrabold'>Status</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Disponível para novas vendas
                </p>
              </div>
              <button
                aria-checked={status === 'active'}
                aria-label={status === 'active' ? 'Combo ativo' : 'Combo inativo'}
                className={`relative mt-0.5 h-7 w-12 rounded-full p-1 transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${status === 'active' ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                onClick={() =>
                  handleStatusChange(status === 'active' ? 'inactive' : 'active')
                }
                role='switch'
                type='button'
              >
                <span
                  className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${status === 'active' ? 'translate-x-5' : ''}`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-card'>
          <CardHeader className='flex flex-col gap-3 border-b border-border-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
            <div>
              <h2 className='text-lg font-extrabold'>Produtos do Combo</h2>
              <p className='text-sm text-muted-foreground'>
                Adicione pelo menos dois produtos e configure suas quantidades.
              </p>
            </div>
            <Button
              className='min-h-11'
              onClick={handleOpenProductDialog}
              ref={addProductButtonRef}
              type='button'
              variant='outline'
            >
              <Icon name='plus' />
              Adicionar produto
            </Button>
          </CardHeader>
          <CardContent className='p-5 sm:p-6'>
            {componentDetails.length === 0 ? (
              <div className='grid min-h-32 place-items-center rounded-xl border border-dashed border-border-soft bg-muted/20 p-6 text-center text-sm text-muted-foreground'>
                <div>
                  <Icon name='package' className='mx-auto mb-2 size-7 text-primary' />
                  <p>Nenhum produto adicionado.</p>
                </div>
              </div>
            ) : (
              <div className='space-y-3'>
                {componentDetails.map((details, index) => {
                  const component = details.component
                  return (
                    <div
                      className='grid gap-3 rounded-xl border border-border-soft p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]'
                      key={component.productId}
                    >
                      <div className='flex min-w-0 items-start gap-3'>
                        <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary'>
                          <Icon
                            name={
                              component.kind === 'portion' ? 'ice-cream-bowl' : 'package'
                            }
                          />
                        </span>
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-extrabold'>
                            {details.productName}
                          </p>
                          <p className='mt-1 text-xs text-muted-foreground'>
                            {componentLabel(details)}
                          </p>
                          {details.validity === 'invalid' ? (
                            <Badge variant='destructive'>Configuração indisponível</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className='flex items-center gap-2 sm:self-center'>
                        <Button
                          aria-label={`Reduzir quantidade de ${details.productName}`}
                          onClick={() =>
                            handleQuantityChange(index, component.quantity - 1)
                          }
                          size='icon-sm'
                          type='button'
                          variant='outline'
                        >
                          −
                        </Button>
                        <output
                          aria-label={`Quantidade de ${details.productName}`}
                          className='w-8 text-center font-extrabold'
                        >
                          {component.quantity}
                        </output>
                        <Button
                          aria-label={`Aumentar quantidade de ${details.productName}`}
                          onClick={() =>
                            handleQuantityChange(index, component.quantity + 1)
                          }
                          size='icon-sm'
                          type='button'
                          variant='outline'
                        >
                          +
                        </Button>
                      </div>
                      <div className='flex items-center justify-between gap-3 sm:block sm:text-right'>
                        <p className='font-extrabold'>
                          {formatCurrency(details.unitPrice * component.quantity)}
                        </p>
                        <Button
                          aria-label={`Remover ${details.productName}`}
                          className='mt-1 text-destructive'
                          onClick={(event) =>
                            handleRequestRemoveComponent(index, event.currentTarget)
                          }
                          size='sm'
                          type='button'
                          variant='ghost'
                        >
                          <Icon name='trash-2' />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {errors.components ? (
              <p className='mt-3 text-sm font-semibold text-destructive' role='alert'>
                {errors.components.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className='rounded-2xl shadow-card'>
          <CardHeader className='border-b border-border-soft p-5 sm:p-6'>
            <h2 className='text-lg font-extrabold'>Preço do Combo</h2>
            <p className='text-sm text-muted-foreground'>
              O preço especial deve ser menor que o valor normal.
            </p>
          </CardHeader>
          <CardContent className='grid gap-5 p-5 sm:grid-cols-[minmax(220px,320px)_1fr] sm:p-6'>
            <div>
              <Label htmlFor='combo-fixed-price'>Preço do combo</Label>
              <div className='relative mt-2'>
                <span className='pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-sm font-bold text-muted-foreground'>
                  R$
                </span>
                <Input
                  aria-describedby={
                    errors.fixedPrice ? 'combo-fixed-price-error' : undefined
                  }
                  aria-invalid={Boolean(errors.fixedPrice)}
                  className='pl-11'
                  id='combo-fixed-price'
                  inputMode='decimal'
                  placeholder='0,00'
                  {...register('fixedPrice')}
                />
              </div>
              {errors.fixedPrice ? (
                <p
                  className='mt-1 text-sm font-semibold text-destructive'
                  id='combo-fixed-price-error'
                >
                  {errors.fixedPrice.message}
                </p>
              ) : null}
            </div>
            <div className='rounded-xl border border-border-soft bg-muted/30 p-4'>
              <dl className='grid gap-3 text-sm'>
                <div className='flex justify-between gap-4'>
                  <dt className='text-muted-foreground'>Valor normal</dt>
                  <dd className='font-bold'>{formatCurrency(normalPrice)}</dd>
                </div>
                <div className='flex justify-between gap-4'>
                  <dt className='text-muted-foreground'>Combo</dt>
                  <dd className='font-extrabold'>{formatCurrency(fixedPriceNumber)}</dd>
                </div>
                <div className='flex justify-between gap-4 border-t border-border-soft pt-3'>
                  <dt className='font-extrabold'>Economia</dt>
                  <dd
                    className={
                      savings > 0
                        ? 'font-extrabold text-success'
                        : 'font-extrabold text-destructive'
                    }
                  >
                    {savings > 0 ? formatCurrency(savings) : 'Ajuste o preço'}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        {submitError ? (
          <p
            aria-live='assertive'
            className='rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive'
            role='alert'
          >
            {submitError}
          </p>
        ) : null}
        <footer className='flex flex-col-reverse gap-3 border-t border-border-soft pt-5 sm:flex-row sm:justify-end'>
          <Button
            disabled={props.isPending}
            onClick={handleCancel}
            type='button'
            variant='outline'
          >
            Cancelar
          </Button>
          <Button disabled={isSubmitDisabled} type='submit'>
            {props.isPending
              ? 'Salvando…'
              : props.mode === 'create'
                ? 'Criar combo'
                : 'Salvar alterações'}
          </Button>
        </footer>
      </form>
      <ComboProductDialog
        existingProductIds={productIds}
        onAdd={handleAddComponent}
        onOpenChange={handleProductDialogOpenChange}
        open={isProductDialogOpen}
      />
      <RemoveComboProductDialog
        onConfirm={handleConfirmRemoveComponent}
        onOpenChange={handleRemoveProductDialogOpenChange}
        open={isRemoveProductDialogOpen}
        productName={componentPendingRemoval?.productName ?? ''}
        resolveFinalFocus={resolveRemoveProductFinalFocus}
      />
    </>
  )
}
