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
  const form = useProductAccompanimentDialog({ item, onSuccess, open, productId })
  const formatCurrency = useFormatCurrency()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary'>
            <Icon name={form.isEdit ? 'pencil' : 'plus'} />
          </span>
          <div>
            <DialogTitle>
              {form.isEdit ? 'Editar acompanhamento' : 'Vincular acompanhamento'}
            </DialogTitle>
            <DialogDescription className='mt-1'>
              Configure como este item aparece no PDV.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form className='grid gap-5 p-6' onSubmit={form.handleSubmit}>
          <Label className='grid gap-2 font-bold'>
            Acompanhamento
            {form.isEdit ? (
              <Input disabled value={item?.accompanimentProductName ?? ''} />
            ) : form.candidatesError ? (
              <div
                className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
                role='alert'
              >
                <span className='text-sm font-semibold text-destructive'>
                  Não foi possível carregar os acompanhamentos.
                </span>
                <Button
                  className='w-fit'
                  onClick={() => void form.retryCandidates()}
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
                  form.handleValueChange('accompanimentProductId', value)
                }
                value={form.productIdValue || null}
                disabled={form.candidatesLoading}
              >
                <SelectTrigger aria-label='Acompanhamento' className='w-full'>
                  <SelectValue placeholder='Selecione um acompanhamento'>
                    {form.selectedProduct?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {form.candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {form.candidatesLoading ? (
              <span aria-live='polite' className='text-xs text-muted-foreground'>
                Carregando acompanhamentos…
              </span>
            ) : null}
            {form.errors.accompanimentProductId ? (
              <span className='text-sm font-semibold text-destructive'>
                {form.errors.accompanimentProductId.message}
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
              onValueChange={(value) =>
                form.handleValueChange('accompanimentTypeId', value)
              }
              value={form.typeId || null}
            >
              <SelectTrigger aria-label='Tipo' className='w-full'>
                <SelectValue placeholder='Selecione um tipo' />
              </SelectTrigger>
              <SelectContent>
                {form.types.map(({ type }) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.typesLoading ? (
              <span className='text-xs text-muted-foreground'>Carregando tipos…</span>
            ) : null}
            {form.typesError ? (
              <span className='text-sm font-semibold text-destructive'>
                Não foi possível carregar os tipos.
              </span>
            ) : null}
            {form.errors.accompanimentTypeId ? (
              <span className='text-sm font-semibold text-destructive'>
                {form.errors.accompanimentTypeId.message}
              </span>
            ) : null}
          </Label>
          <Label className='grid gap-2 font-bold'>
            Marca atual
            {form.selectedStockError ? (
              <div
                className='grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3'
                role='alert'
              >
                <span className='text-sm font-semibold text-destructive'>
                  Não foi possível carregar a marca e o custo atuais.
                </span>
                <Button
                  className='w-fit'
                  onClick={() => void form.retrySelectedStock()}
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
                form.selectedStockLoading && form.selectedProduct
                  ? 'Carregando…'
                  : (form.source?.name ?? 'Não disponível')
              }
            />
          </Label>
          <Label className='grid gap-2 font-bold'>
            Quantidade por porção
            <div className='flex overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
              <Input
                {...form.register('quantityPerPortion')}
                aria-invalid={Boolean(form.errors.quantityPerPortion)}
                className='h-11 border-0 shadow-none focus-visible:ring-0'
                inputMode='decimal'
                type='text'
              />
              <span className='grid min-w-14 place-items-center border-l bg-muted px-3 text-sm font-bold text-muted-foreground'>
                {item?.unit ?? form.selectedProduct?.unit ?? 'un'}
              </span>
            </div>
            {form.errors.quantityPerPortion ? (
              <span className='text-sm font-semibold text-destructive'>
                {form.errors.quantityPerPortion.message}
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
                {form.selectedStockError && form.selectedProduct
                  ? 'Não foi possível carregar o custo.'
                  : form.selectedStockLoading && form.selectedProduct
                    ? 'Carregando…'
                    : form.estimatedCost === undefined
                      ? 'Não disponível'
                      : formatCurrency(form.estimatedCost)}
              </p>
            </div>
          </div>
          {form.actionError ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              {form.actionError}
            </p>
          ) : null}
          <DialogFooter className='-mx-6 -mb-6'>
            <Button
              disabled={form.isPending}
              onClick={() => onOpenChange(false)}
              type='button'
              variant='outline'
            >
              Cancelar
            </Button>
            <Button disabled={form.isPending} type='submit'>
              {form.isPending
                ? 'Salvando…'
                : form.isEdit
                  ? 'Salvar alterações'
                  : 'Vincular'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
