import type { ProductBrandStock, ProductUnit } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { cn } from '@/ui/shared/lib/utils'

import { useStockAdjustmentDialog } from './use-stock-adjustment-dialog'

export type StockAdjustmentDialogProps = {
  allowNegativeStock: boolean
  brand?: ProductBrandStock
  currentBalance: number
  isOpen: boolean
  productId: string
  type: 'entry' | 'write-off'
  unit: ProductUnit
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const StockAdjustmentDialog = (props: StockAdjustmentDialogProps) => {
  const { brand, currentBalance, isOpen, type, unit, onOpenChange } = props
  const {
    baseQuantity,
    errors,
    formError,
    inputMode,
    isInsufficient,
    isPending,
    prospectiveBalance,
    quantity,
    handleInputModeChange,
    handleQuantityChange,
    handleSubmit,
    register,
  } = useStockAdjustmentDialog(props)
  const isEntry = type === 'entry'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='border-b border-border-soft p-5 pr-14 sm:p-6 sm:pr-14'>
          <div
            className={cn(
              'mb-2 grid size-10 place-items-center rounded-xl',
              isEntry ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
            )}
          >
            <Icon name={isEntry ? 'arrow-down' : 'arrow-up'} />
          </div>
          <DialogTitle>{isEntry ? 'Entrada' : 'Baixa'} de estoque</DialogTitle>
          <DialogDescription>
            {brand ? `${brand.brand.name} · ` : ''}Saldo atual: {currentBalance} {unit}
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit}>
          <div className='grid gap-5 p-5 sm:p-6'>
            {brand ? (
              <fieldset>
                <legend className='mb-2 text-sm font-bold'>Informar quantidade em</legend>
                <div className='grid grid-cols-2 rounded-xl bg-muted p-1'>
                  {(['baseUnit', 'package'] as const).map((mode) => (
                    <Button
                      aria-pressed={inputMode === mode}
                      className={cn(
                        'min-w-0 whitespace-normal',
                        inputMode === mode && 'bg-card text-primary shadow-sm',
                      )}
                      key={mode}
                      onClick={() => handleInputModeChange(mode)}
                      type='button'
                      variant='ghost'
                    >
                      {mode === 'baseUnit' ? `Unidade base (${unit})` : 'Embalagens'}
                    </Button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <Label className='grid gap-2 font-bold' htmlFor='stock-adjustment-quantity'>
              Quantidade
              <div className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <Input
                  {...register('quantity', { onChange: handleQuantityChange })}
                  aria-describedby={
                    errors.quantity ? 'stock-adjustment-quantity-error' : undefined
                  }
                  aria-invalid={Boolean(errors.quantity)}
                  autoFocus
                  className='h-11 rounded-none border-0 shadow-none focus-visible:ring-0'
                  data-focus-ring='delegated'
                  id='stock-adjustment-quantity'
                  inputMode='decimal'
                  min='0'
                  placeholder='0'
                  step='any'
                  type='number'
                />
                <span className='grid min-w-20 shrink-0 place-items-center whitespace-nowrap border-l bg-muted px-3 text-sm font-extrabold text-muted-foreground'>
                  {inputMode === 'package' ? 'pacotes' : unit}
                </span>
              </div>
              {errors.quantity ? (
                <span
                  id='stock-adjustment-quantity-error'
                  role='alert'
                  className='text-sm text-destructive'
                >
                  {errors.quantity.message}
                </span>
              ) : null}
            </Label>

            {inputMode === 'package' && brand ? (
              <div className='rounded-xl bg-primary-soft p-4 text-sm'>
                <p className='font-bold text-primary'>Conversão da embalagem</p>
                <p className='mt-1 text-muted-foreground'>
                  {quantity || '0'} × {brand.brand.packageQuantity} {unit} ={' '}
                  <strong className='text-foreground'>
                    {baseQuantity} {unit}
                  </strong>
                </p>
              </div>
            ) : null}

            <div
              className={cn(
                'rounded-xl border p-4 text-sm',
                isInsufficient
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-border-soft bg-muted/50',
              )}
            >
              <p className='font-bold'>Saldo após a movimentação</p>
              <p
                className={cn(
                  'mt-1 text-lg font-extrabold',
                  isInsufficient && 'text-destructive',
                )}
              >
                {prospectiveBalance} {unit}
              </p>
              {isInsufficient ? (
                <p className='mt-2 text-destructive' role='alert'>
                  Estoque insuficiente. Disponível: {currentBalance} {unit}; solicitado:{' '}
                  {baseQuantity} {unit}.
                </p>
              ) : null}
            </div>

            {formError ? (
              <p className='text-sm font-semibold text-destructive' role='alert'>
                {formError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button disabled={isPending} type='button' variant='outline' />}
            >
              Cancelar
            </DialogClose>
            <Button disabled={isPending || isInsufficient} type='submit'>
              {isPending ? 'Confirmando…' : `Confirmar ${isEntry ? 'entrada' : 'baixa'}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
