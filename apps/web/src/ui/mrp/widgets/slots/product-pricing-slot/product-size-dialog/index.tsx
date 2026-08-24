import type { ProductSizePricing } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useProductSizeDialog } from './use-product-size-dialog'

export type ProductSizeDialogProps = {
  isOpen: boolean
  productId: string
  size?: ProductSizePricing
  unit: string
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const ProductSizeDialog = (props: ProductSizeDialogProps) => {
  const { isOpen, onOpenChange, size, unit } = props
  const { errors, formError, handleSubmit, isEdit, isPending, register } =
    useProductSizeDialog(props)
  const title = isEdit ? 'Editar tamanho' : 'Adicionar tamanho'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[520px]'>
        <DialogHeader className='border-b border-border-soft p-5 pr-14 sm:p-6 sm:pr-14'>
          <div className='grid size-11 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name={isEdit ? 'pencil' : 'plus'} />
          </div>
          <div>
            <DialogTitle className='mt-1'>{title}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Atualize os dados comerciais deste tamanho.'
                : 'Informe os dados comerciais para vender este tamanho.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form className='grid gap-5 p-5 sm:p-6' noValidate onSubmit={handleSubmit}>
          <Label className='grid gap-2 font-bold' htmlFor='product-size-name'>
            Nome
            <Input
              {...register('name')}
              aria-describedby={errors.name ? 'product-size-name-error' : undefined}
              aria-invalid={Boolean(errors.name)}
              autoFocus
              id='product-size-name'
              placeholder='Ex.: 300 ml'
            />
            {errors.name ? (
              <span
                className='text-sm font-semibold text-destructive'
                id='product-size-name-error'
                role='alert'
              >
                {errors.name.message}
              </span>
            ) : null}
          </Label>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label className='font-bold' htmlFor='product-size-quantity'>
                Quantidade
              </Label>
              <div className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <Input
                  {...register('quantity')}
                  aria-describedby={
                    errors.quantity ? 'product-size-quantity-error' : undefined
                  }
                  aria-invalid={Boolean(errors.quantity)}
                  className='h-11 rounded-none border-0 shadow-none focus-visible:ring-0'
                  data-focus-ring='delegated'
                  id='product-size-quantity'
                  inputMode='decimal'
                  placeholder='0'
                  type='text'
                />
                <span className='grid min-w-14 place-items-center border-l bg-muted px-3 text-sm font-extrabold text-muted-foreground'>
                  {unit}
                </span>
              </div>
              {errors.quantity ? (
                <span
                  className='text-sm font-semibold text-destructive'
                  id='product-size-quantity-error'
                  role='alert'
                >
                  {errors.quantity.message}
                </span>
              ) : null}
            </div>

            <div className='grid gap-2'>
              <Label className='font-bold' htmlFor='product-size-price'>
                Preço
              </Label>
              <div className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <span className='grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-extrabold text-muted-foreground'>
                  R$
                </span>
                <Input
                  {...register('price')}
                  aria-describedby={errors.price ? 'product-size-price-error' : undefined}
                  aria-invalid={Boolean(errors.price)}
                  className='h-11 rounded-none border-0 shadow-none focus-visible:ring-0'
                  data-focus-ring='delegated'
                  id='product-size-price'
                  inputMode='decimal'
                  placeholder='0,00'
                  type='text'
                />
              </div>
              {errors.price ? (
                <span
                  className='text-sm font-semibold text-destructive'
                  id='product-size-price-error'
                  role='alert'
                >
                  {errors.price.message}
                </span>
              ) : null}
            </div>
          </div>

          {isEdit ? (
            <Label
              className='flex items-center justify-between gap-3 rounded-xl border border-border p-3 font-bold'
              htmlFor='product-size-active'
            >
              <span>
                Ativo
                <span className='mt-1 block text-xs font-normal text-muted-foreground'>
                  Tamanhos ativos aparecem nas vendas futuras.
                </span>
              </span>
              <input
                {...register('isActive')}
                aria-label='Tamanho ativo'
                className='peer sr-only'
                id='product-size-active'
                type='checkbox'
              />
              <span className='relative h-6 w-11 rounded-full bg-border transition-colors peer-checked:bg-success peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 motion-reduce:after:transition-none' />
            </Label>
          ) : null}

          <div className='rounded-xl border border-border-soft bg-muted/50 p-4 text-sm'>
            <p className='text-xs font-extrabold uppercase tracking-wide text-muted-foreground'>
              Projeção atual
            </p>
            <p className='mt-1 text-muted-foreground'>
              {isEdit && size?.operatingCost !== undefined
                ? `Custo operacional: R$ ${size.operatingCost.toFixed(2).replace('.', ',')}`
                : 'O custo e a margem aparecem quando houver custo operacional atual.'}
            </p>
          </div>

          {formError ? (
            <p
              className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-semibold text-destructive'
              role='alert'
            >
              {formError}
            </p>
          ) : null}

          <DialogFooter className='-mx-5 -mb-5 sm:-mx-6 sm:-mb-6'>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type='button'
              variant='outline'
            >
              Cancelar
            </Button>
            <Button disabled={isPending} type='submit'>
              {isPending
                ? 'Salvando…'
                : isEdit
                  ? 'Salvar alterações'
                  : 'Adicionar tamanho'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
