import type { ProductAccompanimentDetails } from '@scoops/core/mrp/domain/structures'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'

import type { ProductAccompanimentDialogState } from '../use-product-accompaniment-dialog'

const UNIT_COST_FORMATTER = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 5,
  minimumFractionDigits: 2,
  useGrouping: false,
})

export function ProductAccompanimentDialogFields({
  item,
  state,
}: {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}) {
  return (
    <div className='grid min-h-0 gap-3 overflow-y-auto p-4 sm:gap-5 sm:p-6'>
      <ProductField item={item} state={state} />
      <TypeField state={state} />
      <BrandField item={item} state={state} />
      <PriceField state={state} />
      <QuantityField item={item} state={state} />
      <CostEstimate item={item} state={state} />
      {state.actionError ? (
        <p className='text-sm font-semibold text-destructive' role='alert'>
          {state.actionError}
        </p>
      ) : null}
    </div>
  )
}

function ProductField({
  item,
  state,
}: {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}) {
  return (
    <Label className='grid gap-2 font-bold'>
      Acompanhamento
      {item ? (
        <Input disabled value={item.accompanimentProductName} />
      ) : state.candidatesError ? (
        <CandidateLoadError onRetry={state.retryCandidates} />
      ) : (
        <CandidateSelect state={state} />
      )}
      {state.candidatesLoading ? (
        <span aria-live='polite' className='text-xs text-muted-foreground'>
          Carregando acompanhamentos…
        </span>
      ) : null}
      {state.errors.accompanimentProductId ? (
        <span className='text-sm font-semibold text-destructive'>
          {state.errors.accompanimentProductId.message}
        </span>
      ) : null}
    </Label>
  )
}

function CandidateLoadError({ onRetry }: { onRetry: () => unknown }) {
  return (
    <div
      className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
      role='alert'
    >
      <span className='text-sm font-semibold text-destructive'>
        Não foi possível carregar os acompanhamentos.
      </span>
      <Button
        className='w-fit'
        onClick={() => void onRetry()}
        size='sm'
        type='button'
        variant='outline'
      >
        Tentar novamente
      </Button>
    </div>
  )
}

function CandidateSelect({ state }: { state: ProductAccompanimentDialogState }) {
  return (
    <Select
      disabled={state.candidatesLoading}
      onValueChange={(value) => state.handleValueChange('accompanimentProductId', value)}
      value={state.productIdValue || null}
    >
      <SelectTrigger aria-label='Acompanhamento' className='w-full'>
        <SelectValue placeholder='Selecione um acompanhamento'>
          {state.selectedProduct?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {state.candidates.map((candidate) => (
          <SelectItem key={candidate.id} value={candidate.id}>
            {candidate.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TypeField({ state }: { state: ProductAccompanimentDialogState }) {
  return (
    <Label className='grid gap-2 font-bold'>
      <span className='flex items-center justify-between gap-3'>
        Tipo
        <Anchor className='text-xs font-bold text-primary' route='accompanimentTypes'>
          Gerenciar tipos →
        </Anchor>
      </span>
      <TypeSelect state={state} />
      <TypeFeedback state={state} />
    </Label>
  )
}

function TypeSelect({ state }: { state: ProductAccompanimentDialogState }) {
  return (
    <Select
      onValueChange={(value) => state.handleValueChange('accompanimentTypeId', value)}
      value={state.typeId || null}
    >
      <SelectTrigger aria-label='Tipo' className='w-full'>
        <SelectValue placeholder='Selecione um tipo'>
          {state.typeId ? (state.selectedTypeName ?? 'Carregando tipo…') : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {state.types.map(({ type }) => (
          <SelectItem key={type.id} value={type.id}>
            {type.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TypeFeedback({ state }: { state: ProductAccompanimentDialogState }) {
  return (
    <>
      {state.typesLoading ? (
        <span className='text-xs text-muted-foreground'>Carregando tipos…</span>
      ) : null}
      {state.typesError ? (
        <span className='text-sm font-semibold text-destructive'>
          Não foi possível carregar os tipos.
        </span>
      ) : null}
      {state.errors.accompanimentTypeId ? (
        <span className='text-sm font-semibold text-destructive'>
          {state.errors.accompanimentTypeId.message}
        </span>
      ) : null}
    </>
  )
}

function BrandField({
  item,
  state,
}: {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}) {
  return (
    <Label className='grid gap-2 font-bold'>
      Marca atual
      {state.selectedStockError ? (
        <StockLoadError onRetry={state.retrySelectedStock} />
      ) : null}
      <Input aria-label='Marca atual' disabled value={getBrandName(item, state)} />
    </Label>
  )
}

function StockLoadError({ onRetry }: { onRetry: () => unknown }) {
  return (
    <div
      className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
      role='alert'
    >
      <span className='text-sm font-semibold text-destructive'>
        Não foi possível carregar a marca e o custo atuais.
      </span>
      <Button
        className='w-fit'
        onClick={() => void onRetry()}
        size='sm'
        type='button'
        variant='outline'
      >
        Tentar novamente
      </Button>
    </div>
  )
}

function getBrandName(
  item: ProductAccompanimentDetails | undefined,
  state: ProductAccompanimentDialogState,
) {
  if (state.selectedStockLoading && state.selectedProduct) return 'Carregando…'
  return state.source?.name ?? item?.brandName ?? 'Não disponível'
}

function PriceField({ state }: { state: ProductAccompanimentDialogState }) {
  return (
    <Label className='grid gap-2 font-bold'>
      Preço do acompanhamento
      <PriceInput state={state} />
      <PriceHelp state={state} />
      <PriceFeedback state={state} />
    </Label>
  )
}

function PriceInput({ state }: { state: ProductAccompanimentDialogState }) {
  return (
    <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
      <span className='grid min-w-12 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground'>
        R$
      </span>
      <Input
        {...state.register('accompanimentPrice')}
        aria-describedby={getPriceDescription(state)}
        aria-invalid={Boolean(
          state.errors.accompanimentPrice || state.accompanimentPriceError,
        )}
        aria-label='Preço do acompanhamento'
        className='h-10 border-0 shadow-none focus-visible:ring-0'
        inputMode='decimal'
        type='text'
      />
    </div>
  )
}

function PriceFeedback({ state }: { state: ProductAccompanimentDialogState }) {
  return (
    <>
      {state.accompanimentPriceLoading ? <PriceLoading /> : null}
      {state.accompanimentPriceError ? (
        <PriceLoadError onRetry={state.retryAccompanimentPrice} />
      ) : null}
      {state.errors.accompanimentPrice ? (
        <span
          className='text-sm font-semibold text-destructive'
          id='accompaniment-price-validation-error'
          role='alert'
        >
          {state.errors.accompanimentPrice.message}
        </span>
      ) : null}
    </>
  )
}

function getPriceDescription(state: ProductAccompanimentDialogState) {
  return `accompaniment-price-help${state.errors.accompanimentPrice ? ' accompaniment-price-validation-error' : ''}${state.accompanimentPriceError ? ' accompaniment-price-read-error' : ''}`
}

function PriceHelp({ state }: { state: ProductAccompanimentDialogState }) {
  return (
    <span
      className='text-xs font-normal text-muted-foreground'
      id='accompaniment-price-help'
    >
      Este preço vale para todos os vínculos e tamanhos.
      {state.accompanimentPriceIsSaved ? (
        <span className='block'>Preço já configurado para este produto.</span>
      ) : state.accompanimentPriceSuggestion !== null ? (
        <PriceSuggestion mode={state.accompanimentPriceSuggestionMode} />
      ) : null}
    </span>
  )
}

function PriceSuggestion({
  mode,
}: {
  mode: ProductAccompanimentDialogState['accompanimentPriceSuggestionMode']
}) {
  return (
    <span className='block'>
      Sugestão baseada no preço de revenda
      {mode === 'resale-by-brand' ? ' da marca principal' : ' único'}.
    </span>
  )
}

function PriceLoading() {
  return (
    <span aria-live='polite' className='text-xs text-muted-foreground' role='status'>
      Carregando preço do acompanhamento…
    </span>
  )
}

function PriceLoadError({ onRetry }: { onRetry: () => unknown }) {
  return (
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
        onClick={() => void onRetry()}
        size='sm'
        type='button'
        variant='outline'
      >
        Tentar novamente
      </Button>
    </div>
  )
}

function QuantityField({
  item,
  state,
}: {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}) {
  return (
    <Label className='grid gap-2 font-bold'>
      Quantidade por porção
      <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
        <Input
          {...state.register('quantityPerPortion')}
          aria-invalid={Boolean(state.errors.quantityPerPortion)}
          className='h-10 border-0 shadow-none focus-visible:ring-0'
          inputMode='decimal'
          type='text'
        />
        <span className='grid min-w-14 place-items-center border-l bg-muted px-3 text-sm font-bold text-muted-foreground'>
          {item?.unit ?? state.selectedProduct?.unit ?? 'un'}
        </span>
      </div>
      {state.errors.quantityPerPortion ? (
        <span className='text-sm font-semibold text-destructive'>
          {state.errors.quantityPerPortion.message}
        </span>
      ) : null}
    </Label>
  )
}

function CostEstimate({
  item,
  state,
}: {
  item?: ProductAccompanimentDetails
  state: ProductAccompanimentDialogState
}) {
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  const unit = item?.unit ?? state.selectedProduct?.unit ?? 'un'
  const estimate = getEstimatedCostLabel(state, formatCurrency)

  return (
    <div className='flex items-center gap-3 rounded-xl bg-muted p-4 text-sm'>
      <Icon className='size-5 text-muted-foreground' name='calculator' />
      <div className='flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-xs font-semibold text-muted-foreground'>CUSTO POR PORÇÃO</p>
          <p className='font-extrabold'>{estimate}</p>
        </div>
        {state.source?.unitCost !== undefined && state.numericQuantity > 0 ? (
          <p className='break-words text-xs text-muted-foreground sm:text-right'>
            {formatQuantity(state.numericQuantity, unit)} × R${' '}
            {UNIT_COST_FORMATTER.format(state.source.unitCost)}/{unit}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function getEstimatedCostLabel(
  state: ProductAccompanimentDialogState,
  formatCurrency: (amount: number) => string,
) {
  if (state.selectedStockError && state.selectedProduct)
    return 'Não foi possível carregar o custo.'
  if (state.selectedStockLoading && state.selectedProduct) return 'Carregando…'
  if (state.estimatedCost === undefined) return 'Não disponível'
  return formatCurrency(state.estimatedCost)
}
