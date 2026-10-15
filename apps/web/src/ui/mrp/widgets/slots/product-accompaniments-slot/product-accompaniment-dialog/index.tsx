import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Button } from '@/ui/shadcn/button'
import { Dialog, DialogContent, DialogFooter } from '@/ui/shadcn/dialog'
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
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ProductAccompanimentDialogHeader } from './product-accompaniment-dialog-header'
import { useProductAccompanimentDialog } from './use-product-accompaniment-dialog'

const UNIT_COST_FORMATTER = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 5,
  minimumFractionDigits: 2,
  useGrouping: false,
})

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
    accompanimentPriceError,
    accompanimentPriceIsSaved,
    accompanimentPriceLoading,
    accompanimentPriceSuggestion,
    accompanimentPriceSuggestionMode,
    canSave,
    candidates,
    candidatesError,
    candidatesLoading,
    errors,
    estimatedCost,
    handleSubmit,
    handleValueChange,
    isEdit,
    isRefreshing,
    isPending,
    productIdValue,
    numericQuantity,
    register,
    retryCandidates,
    retryAccompanimentPrice,
    retrySelectedStock,
    selectedProduct,
    selectedStockError,
    selectedStockLoading,
    selectedTypeName,
    source,
    typeId,
    types,
    typesError,
    typesLoading,
  } = useProductAccompanimentDialog({ item, onSuccess, open, productId })
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  const unit = item?.unit ?? selectedProduct?.unit ?? 'un'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100dvh-2rem)] min-h-0 overflow-hidden sm:max-w-lg'>
        <ProductAccompanimentDialogHeader isEdit={isEdit} isRefreshing={isRefreshing} />
        <form
          className='grid min-h-0 grid-rows-[minmax(0,1fr)_auto]'
          onSubmit={handleSubmit}
        >
          <div className='grid min-h-0 gap-3 overflow-y-auto p-4 sm:gap-5 sm:p-6'>
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
                  <SelectValue placeholder='Selecione um tipo'>
                    {typeId ? (selectedTypeName ?? 'Carregando tipo…') : undefined}
                  </SelectValue>
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
              Preço do acompanhamento
              <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <span className='grid min-w-12 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground'>
                  R$
                </span>
                <Input
                  {...register('accompanimentPrice')}
                  aria-describedby={`accompaniment-price-help${errors.accompanimentPrice ? ' accompaniment-price-validation-error' : ''}${accompanimentPriceError ? ' accompaniment-price-read-error' : ''}`}
                  aria-invalid={Boolean(
                    errors.accompanimentPrice || accompanimentPriceError,
                  )}
                  aria-label='Preço do acompanhamento'
                  className='h-10 border-0 shadow-none focus-visible:ring-0'
                  inputMode='decimal'
                  type='text'
                />
              </div>
              <span
                className='text-xs font-normal text-muted-foreground'
                id='accompaniment-price-help'
              >
                Este preço vale para todos os vínculos e tamanhos.
                {accompanimentPriceIsSaved ? (
                  <span className='block'>Preço já configurado para este produto.</span>
                ) : accompanimentPriceSuggestion !== null ? (
                  <span className='block'>
                    Sugestão baseada no preço de revenda
                    {accompanimentPriceSuggestionMode === 'resale-by-brand'
                      ? ' da marca principal'
                      : ' único'}
                    .
                  </span>
                ) : null}
              </span>
              {accompanimentPriceLoading ? (
                <span
                  aria-live='polite'
                  className='text-xs text-muted-foreground'
                  role='status'
                >
                  Carregando preço do acompanhamento…
                </span>
              ) : null}
              {accompanimentPriceError ? (
                <div
                  className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
                  role='alert'
                >
                  <span
                    className='text-sm font-semibold text-destructive'
                    id='accompaniment-price-read-error'
                  >
                    Não foi possível carregar o preço do acompanhamento.
                  </span>
                  <Button
                    className='w-fit'
                    onClick={() => void retryAccompanimentPrice()}
                    size='sm'
                    type='button'
                    variant='outline'
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : null}
              {errors.accompanimentPrice ? (
                <span
                  className='text-sm font-semibold text-destructive'
                  id='accompaniment-price-validation-error'
                  role='alert'
                >
                  {errors.accompanimentPrice.message}
                </span>
              ) : null}
            </Label>
            <Label className='grid gap-2 font-bold'>
              Quantidade por porção
              <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <Input
                  {...register('quantityPerPortion')}
                  aria-invalid={Boolean(errors.quantityPerPortion)}
                  className='h-10 border-0 shadow-none focus-visible:ring-0'
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
              <div className='flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='text-xs font-semibold text-muted-foreground'>
                    CUSTO POR PORÇÃO
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
                {source?.unitCost !== undefined && numericQuantity > 0 ? (
                  <p className='break-words text-xs text-muted-foreground sm:text-right'>
                    {formatQuantity(numericQuantity, unit)} × R${' '}
                    {UNIT_COST_FORMATTER.format(source.unitCost)}/{unit}
                  </p>
                ) : null}
              </div>
            </div>
            {actionError ? (
              <p className='text-sm font-semibold text-destructive' role='alert'>
                {actionError}
              </p>
            ) : null}
          </div>
          <DialogFooter className='p-4 sm:p-6'>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type='button'
              variant='outline'
            >
              Cancelar
            </Button>
            <Button disabled={isPending || !canSave} type='submit'>
              {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Vincular'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
