import type { ProductBrandStock, ProductUnit } from '@scoops/core/mrp/domain/structures'

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
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useProductBrandDialog } from './use-product-brand-dialog'

export type ProductBrandDialogProps = {
  brand?: ProductBrandStock
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  open: boolean
  productId: string
  productName: string
  unit: ProductUnit
  variant: 'add' | 'edit'
}

export const ProductBrandDialog = (props: ProductBrandDialogProps) => {
  const { productName, unit, variant } = props
  const formatCurrency = useFormatCurrency()
  const {
    actionError,
    errors,
    isPending,
    packageQuantity,
    packageValue,
    unitPrice,
    handleOpenChange,
    handleSubmit,
    register,
  } = useProductBrandDialog(props)
  const isAdd = variant === 'add'

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-h-[calc(100vh-1rem)] overflow-y-auto bg-card data-open:animate-none sm:max-w-[520px]'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-4 pr-14 sm:p-6 sm:pr-14'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
            <Icon className='size-5' name='tags' />
          </span>
          <div className='min-w-0'>
            <DialogTitle>{isAdd ? 'Adicionar marca' : 'Editar marca'}</DialogTitle>
            <DialogDescription className='mt-1'>
              {isAdd
                ? 'Cadastre um fornecedor com preço e estoque próprios.'
                : 'Atualize a configuração da marca sem alterar o estoque.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form className='grid gap-4 p-4 sm:gap-5 sm:p-6' onSubmit={handleSubmit}>
          <input type='hidden' {...register('variant')} />
          <div className='flex items-center justify-between gap-4 rounded-xl bg-muted px-4 py-3'>
            <div className='min-w-0'>
              <p className='text-[11px] font-semibold uppercase text-muted-foreground'>
                Produto
              </p>
              <p className='truncate font-bold'>{productName}</p>
            </div>
            <div className='shrink-0 text-right'>
              <p className='text-[11px] font-semibold uppercase text-muted-foreground'>
                Unidade
              </p>
              <p className='font-bold'>{unit}</p>
            </div>
          </div>

          <Field label='Nome da marca' error={errors.name?.message}>
            <Input
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
              autoFocus
              className='h-11 rounded-xl'
              placeholder='Ex: Frooty'
            />
          </Field>

          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Qtd. por embalagem' error={errors.packageQuantity?.message}>
              <AffixedInput suffix={unit}>
                <Input
                  {...register('packageQuantity')}
                  aria-invalid={Boolean(errors.packageQuantity)}
                  className='h-11 rounded-r-none border-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
                  data-focus-ring='delegated'
                  inputMode='decimal'
                />
              </AffixedInput>
            </Field>
            <Field label='Valor por embalagem' error={errors.packageValue?.message}>
              <AffixedInput prefix='R$'>
                <Input
                  {...register('packageValue')}
                  aria-invalid={Boolean(errors.packageValue)}
                  className='h-11 rounded-none border-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
                  data-focus-ring='delegated'
                  inputMode='decimal'
                />
              </AffixedInput>
            </Field>
          </div>

          {isAdd ? (
            <Field
              label='Estoque inicial (opcional)'
              error={
                'initialQuantity' in errors ? errors.initialQuantity?.message : undefined
              }
            >
              <AffixedInput suffix={unit}>
                <Input
                  {...register('initialQuantity')}
                  aria-invalid={
                    'initialQuantity' in errors && Boolean(errors.initialQuantity)
                  }
                  className='h-11 rounded-r-none border-0 shadow-none focus-visible:border-transparent focus-visible:ring-0'
                  data-focus-ring='delegated'
                  inputMode='decimal'
                />
              </AffixedInput>
            </Field>
          ) : null}

          <div className='flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-muted/60 px-4 py-3'>
            <div>
              <p className='text-[11px] font-semibold uppercase text-muted-foreground'>
                Preço unitário
              </p>
              <p className='text-lg font-extrabold'>
                {formatCurrency(unitPrice)} / {unit}
              </p>
            </div>
            <div className='text-right text-xs text-muted-foreground'>
              <p className='font-semibold uppercase'>Cálculo</p>
              <p>
                {formatCurrency(Number(packageValue) || 0)} ÷{' '}
                {Number(packageQuantity) || 0} {unit}
              </p>
            </div>
          </div>

          {actionError ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              Não foi possível salvar a marca. Revise os dados e tente novamente.
            </p>
          ) : null}

          <DialogFooter className='-mx-4 -mb-4 bg-muted sm:-mx-6 sm:-mb-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type='submit' className='shadow-primary' disabled={isPending}>
              {isPending ? 'Salvando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode
  error?: string
  label: string
}) {
  return (
    <Label className='grid gap-2 text-sm font-semibold'>
      {label}
      {children}
      {error ? (
        <span className='text-xs font-semibold text-destructive'>{error}</span>
      ) : null}
    </Label>
  )
}

function AffixedInput({
  children,
  prefix,
  suffix,
}: {
  children: React.ReactNode
  prefix?: string
  suffix?: string
}) {
  return (
    <span className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
      {prefix ? (
        <span className='grid min-w-12 shrink-0 place-items-center whitespace-nowrap border-r bg-muted px-3 font-bold text-muted-foreground'>
          {prefix}
        </span>
      ) : null}
      {children}
      {suffix ? (
        <span className='grid min-w-10 shrink-0 place-items-center whitespace-nowrap border-l bg-muted px-3 font-bold text-muted-foreground'>
          {suffix}
        </span>
      ) : null}
    </span>
  )
}
