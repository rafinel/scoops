import type { Product } from '@scoops/core/mrp/domain/entities'
import type { RecipeDetails } from '@scoops/core/mrp/domain/structures'
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useProduceProductDialog } from './use-produce-product-dialog'

export type ProduceProductDialogProps = {
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  product: Product
  recipe: RecipeDetails
}
export const ProduceProductDialog = ({
  onOpenChange,
  onSuccess,
  open,
  product,
  recipe,
}: ProduceProductDialogProps) => {
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  const dialog = useProduceProductDialog({ open, productId: product.id, recipe })
  const preview = dialog.preview.data
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='min-w-0 max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader className='min-w-0 flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name='chef-hat' />
          </span>
          <div className='min-w-0'>
            <DialogTitle>Registrar produção</DialogTitle>
            <DialogDescription className='mt-1'>
              {product.name} · receita de {recipe.yieldQuantity} {product.unit}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className='grid min-w-0 gap-5 p-6'>
          <p className='font-bold'>Quantidade a produzir</p>
          <div className='grid gap-3 sm:grid-cols-[1fr_auto]'>
            <div className='grid grid-cols-2 rounded-xl bg-muted p-1'>
              <Button
                aria-pressed={dialog.mode === 'batches'}
                className={
                  dialog.mode === 'batches'
                    ? 'bg-card font-semibold text-foreground shadow-sm ring-1 ring-border/70'
                    : 'text-muted-foreground hover:bg-background/70'
                }
                onClick={() => dialog.handleModeChange('batches')}
                type='button'
                variant='ghost'
              >
                Lote
              </Button>
              <Button
                aria-pressed={dialog.mode === 'quantity'}
                className={
                  dialog.mode === 'quantity'
                    ? 'bg-card font-semibold text-foreground shadow-sm ring-1 ring-border/70'
                    : 'text-muted-foreground hover:bg-background/70'
                }
                onClick={() => dialog.handleModeChange('quantity')}
                type='button'
                variant='ghost'
              >
                Quantidade
              </Button>
            </div>
            <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
              <Input
                aria-describedby={
                  dialog.validationError ? 'production-quantity-error' : undefined
                }
                aria-invalid={Boolean(dialog.validationError)}
                aria-label={dialog.mode === 'batches' ? 'Lotes' : 'Quantidade'}
                className='h-11 border-0 shadow-none focus-visible:ring-0'
                inputMode='decimal'
                min='0'
                onChange={(event) => dialog.setValue(event.target.value)}
                step={dialog.mode === 'batches' ? '1' : '0.001'}
                type='number'
                value={dialog.value}
              />
              <span className='grid min-w-16 place-items-center border-l bg-muted px-3 text-sm font-bold'>
                {dialog.mode === 'batches' ? 'lotes' : product.unit}
              </span>
            </div>
          </div>
          <p className='text-sm text-primary'>
            Equivale a {formatQuantity(dialog.quantity || 0, product.unit)}
          </p>
          {dialog.validationError ? (
            <p
              className='text-sm font-semibold text-destructive'
              id='production-quantity-error'
              role='alert'
            >
              {dialog.validationError}
            </p>
          ) : null}
          {dialog.preview.isPending ? (
            <p aria-busy='true' role='status'>
              Calculando projeção…
            </p>
          ) : null}
          {dialog.preview.isError ? (
            <div
              role='alert'
              className='rounded-xl border border-destructive/30 bg-destructive/5 p-4'
            >
              Não foi possível calcular a produção.{' '}
              <Button
                onClick={() => void dialog.preview.refetch()}
                size='sm'
                variant='outline'
              >
                Tentar novamente
              </Button>
            </div>
          ) : null}
          {preview ? (
            <>
              <div className='min-w-0 overflow-hidden rounded-xl border'>
                <Table className='w-full min-w-0 table-fixed text-sm sm:min-w-[560px]'>
                  <TableCaption className='sr-only'>
                    Projeção de consumo dos insumos
                  </TableCaption>
                  <TableHeader className='bg-muted text-xs text-muted-foreground'>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className='w-[34%] p-2 text-left text-[10px] leading-tight whitespace-normal sm:p-3 sm:text-xs sm:whitespace-nowrap'>
                        INGREDIENTE
                      </TableHead>
                      <TableHead className='w-[22%] p-2 text-[10px] leading-tight whitespace-normal sm:text-xs sm:whitespace-nowrap'>
                        CONSUMO
                      </TableHead>
                      <TableHead className='w-[20%] p-2 text-[10px] leading-tight whitespace-normal sm:text-xs sm:whitespace-nowrap'>
                        ATUAL
                      </TableHead>
                      <TableHead className='w-[24%] p-2 text-[10px] leading-tight whitespace-normal sm:p-3 sm:text-xs sm:whitespace-nowrap'>
                        APÓS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.consumptions.map((consumption) => (
                      <TableRow
                        className={
                          consumption.missingQuantity > 0
                            ? 'border-b-0 bg-destructive/5 text-destructive hover:bg-destructive/5'
                            : 'border-b-0 border-t hover:bg-transparent'
                        }
                        key={consumption.ingredientProductId}
                      >
                        <TableCell className='break-words p-3 align-top font-bold whitespace-normal'>
                          {consumption.ingredientProductName}
                        </TableCell>
                        <TableCell className='break-words align-top whitespace-normal sm:whitespace-nowrap'>
                          -{formatQuantity(consumption.quantity, consumption.unit)}
                        </TableCell>
                        <TableCell className='break-words align-top whitespace-normal sm:whitespace-nowrap'>
                          {formatQuantity(consumption.currentBalance, consumption.unit)}
                        </TableCell>
                        <TableCell className='break-words p-3 align-top whitespace-normal'>
                          {formatQuantity(consumption.projectedBalance, consumption.unit)}
                          {consumption.missingQuantity > 0
                            ? ` · faltam ${consumption.missingQuantity}`
                            : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className='grid min-w-0 gap-3 rounded-xl bg-muted p-4 sm:grid-cols-2'>
                <p className='min-w-0'>
                  <span className='block text-xs text-muted-foreground'>
                    CUSTO DA PRODUÇÃO
                  </span>
                  <strong>{formatCurrency(preview.totalCost)}</strong>
                </p>
                <p className='min-w-0'>
                  <span className='block text-xs text-muted-foreground'>
                    ESTOQUE DO PRODUTO
                  </span>
                  <strong className='text-success'>
                    <span className='break-words'>
                      {formatQuantity(preview.currentOutputStock, product.unit)} →{' '}
                      {formatQuantity(preview.projectedOutputStock, product.unit)}
                    </span>
                  </strong>
                </p>
              </div>
              {!preview.canProduce ? (
                <p
                  className='break-words text-sm font-semibold text-destructive'
                  role='alert'
                >
                  {preview.blockReasons.join(' ')}
                </p>
              ) : null}
            </>
          ) : null}
          {dialog.error ? (
            <p
              className='break-words text-sm font-semibold text-destructive'
              role='alert'
            >
              {dialog.error}
            </p>
          ) : null}
        </div>
        <DialogFooter className='min-w-0'>
          <DialogClose
            render={
              <Button disabled={dialog.isPending} type='button' variant='outline' />
            }
          >
            Cancelar
          </DialogClose>
          <Button
            disabled={dialog.isPending || !dialog.isInputValid || !preview?.canProduce}
            onClick={() => void dialog.handleConfirm(onSuccess)}
          >
            {dialog.isPending ? 'Confirmando…' : 'Confirmar produção'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
