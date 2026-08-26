import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useProductAccompanimentDialog } from './use-product-accompaniment-dialog'

export type ProductAccompanimentDialogProps = {
  item?: ProductAccompanimentDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  open: boolean
  productId: string
}

export const ProductAccompanimentDialog = ({
  item,
  onOpenChange,
  onSuccess,
  open,
  productId,
}: ProductAccompanimentDialogProps) => {
  const {
    actionError,
    candidates,
    candidatesError,
    candidatesLoading,
    errors,
    estimatedCost,
    handleSubmit,
    handleValueChange,
    isEdit,
    isPending,
    productIdValue,
    register,
    retryCandidates,
    retrySelectedStock,
    selectedProduct,
    selectedStockError,
    selectedStockLoading,
    source,
    typeId,
    types,
    typesError,
    typesLoading,
  } = useProductAccompanimentDialog({ item, onSuccess, open, productId })
  const formatCurrency = useFormatCurrency()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name={isEdit ? 'pencil' : 'plus'} />
          </span>
          <div>
            <DialogTitle>
              {isEdit ? 'Editar acompanhamento' : 'Vincular acompanhamento'}
            </DialogTitle>
            <DialogDescription className='mt-1'>
              Configure como este item aparece no PDV.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form className='grid gap-5 p-6' onSubmit={handleSubmit}>
          <Label className='grid gap-2 font-bold'>
            Acompanhamento
            {isEdit ? (
              <Input disabled value={item?.accompanimentProductName ?? ''} />
            ) : candidatesError ? (
              <div
                className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
                role='alert'
              >
                <span className='text-sm font-semibold text-destructive'>
                  Não foi possível carregar os acompanhamentos.
                </span>
                <Button
                  className='w-fit'
                  onClick={() => void retryCandidates()}
                  size='sm'
                  type='button'
                  variant='outline'
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <Select
                onValueChange={(value) =>
                  handleValueChange('accompanimentProductId', value)
                }
                value={productIdValue || null}
                disabled={candidatesLoading}
              >
                <SelectTrigger aria-label='Acompanhamento' className='w-full'>
                  <SelectValue placeholder='Selecione um acompanhamento'>
                    {selectedProduct?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {candidatesLoading ? (
              <span aria-live='polite' className='text-xs text-muted-foreground'>
                Carregando acompanhamentos…
              </span>
            ) : null}
            {errors.accompanimentProductId ? (
              <span className='text-sm font-semibold text-destructive'>
                {errors.accompanimentProductId.message}
              </span>
            ) : null}
          </Label>
          <Label className='grid gap-2 font-bold'>
            <span className='flex items-center justify-between gap-3'>
              Tipo
              <Anchor
                className='text-xs font-bold text-primary'
                route='accompanimentTypes'
              >
                Gerenciar tipos →
              </Anchor>
            </span>
            <Select
              onValueChange={(value) => handleValueChange('accompanimentTypeId', value)}
              value={typeId || null}
            >
              <SelectTrigger aria-label='Tipo' className='w-full'>
                <SelectValue placeholder='Selecione um tipo' />
              </SelectTrigger>
              <SelectContent>
                {types.map(({ type }) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {typesLoading ? (
              <span className='text-xs text-muted-foreground'>Carregando tipos…</span>
            ) : null}
            {typesError ? (
              <span className='text-sm font-semibold text-destructive'>
                Não foi possível carregar os tipos.
              </span>
            ) : null}
            {errors.accompanimentTypeId ? (
              <span className='text-sm font-semibold text-destructive'>
                {errors.accompanimentTypeId.message}
              </span>
            ) : null}
          </Label>
          <Label className='grid gap-2 font-bold'>
            Marca atual
            {selectedStockError ? (
              <div
                className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
                role='alert'
              >
                <span className='text-sm font-semibold text-destructive'>
                  Não foi possível carregar a marca e o custo atuais.
                </span>
                <Button
                  className='w-fit'
                  onClick={() => void retrySelectedStock()}
                  size='sm'
                  type='button'
                  variant='outline'
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null}
            <Input
              aria-label='Marca atual'
              disabled
              value={
                selectedStockLoading && selectedProduct
                  ? 'Carregando…'
                  : (source?.name ?? 'Não disponível')
              }
            />
          </Label>
          <Label className='grid gap-2 font-bold'>
            Quantidade por porção
            <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
              <Input
                {...register('quantityPerPortion')}
                aria-invalid={Boolean(errors.quantityPerPortion)}
                className='h-11 border-0 shadow-none focus-visible:ring-0'
                inputMode='decimal'
                type='text'
              />
              <span className='grid min-w-14 place-items-center border-l bg-muted px-3 text-sm font-bold text-muted-foreground'>
                {item?.unit ?? selectedProduct?.unit ?? 'un'}
              </span>
            </div>
            {errors.quantityPerPortion ? (
              <span className='text-sm font-semibold text-destructive'>
                {errors.quantityPerPortion.message}
              </span>
            ) : null}
          </Label>
          <div className='flex items-center gap-3 rounded-xl bg-muted p-4 text-sm'>
            <Icon className='size-5 text-muted-foreground' name='calculator' />
            <div>
              <p className='text-xs font-semibold text-muted-foreground'>
                CUSTO ESTIMADO POR PORÇÃO
              </p>
              <p className='font-extrabold'>
                {selectedStockError && selectedProduct
                  ? 'Não foi possível carregar o custo.'
                  : selectedStockLoading && selectedProduct
                    ? 'Carregando…'
                    : estimatedCost === undefined
                      ? 'Não disponível'
                      : formatCurrency(estimatedCost)}
              </p>
            </div>
          </div>
          {actionError ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              {actionError}
            </p>
          ) : null}
          <DialogFooter className='-mx-6 -mb-6'>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type='button'
              variant='outline'
            >
              Cancelar
            </Button>
            <Button disabled={isPending} type='submit'>
              {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Vincular'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
