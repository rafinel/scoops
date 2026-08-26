import type { SalesChannel } from '@scoops/core/pdv/domain/entities'
import type { SalesChannelStatus } from '@scoops/core/pdv/domain/structures'

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
  type SalesChannelDialogMode,
  useSalesChannelDialog,
} from './use-sales-channel-dialog'

export type SalesChannelDialogProps = {
  channel?: SalesChannel
  mode: SalesChannelDialogMode
  onOpenChange: (open: boolean) => void
  onRequestStatusChange: (channel: SalesChannel, status: SalesChannelStatus) => void
  onSuccess: (message: string) => void
  open: boolean
}

export const SalesChannelDialog = ({
  channel,
  mode,
  onOpenChange,
  onRequestStatusChange,
  onSuccess,
  open,
}: SalesChannelDialogProps) => {
  const {
    actionError,
    adjustedExample,
    currentStatus,
    errors,
    formatCurrency,
    handleStatusChange,
    handleSubmit,
    isPending,
    register,
  } = useSalesChannelDialog({
    channel,
    mode,
    onOpenChange,
    onRequestStatusChange,
    onSuccess,
    open,
  })
  const isEdit = mode === 'edit'
  const adjustmentType =
    adjustedExample > 20 ? 'Acréscimo' : adjustedExample < 20 ? 'Desconto' : 'Neutro'
  const adjustmentColor =
    adjustedExample > 20
      ? 'text-warning'
      : adjustedExample < 20
        ? 'text-info'
        : 'text-foreground'
  const percentageFieldError = errors.percentage?.message
  const nameFieldError = errors.name?.message

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[520px]'>
        <DialogHeader className='border-b border-border-soft p-6 pr-14'>
          <DialogTitle>{isEdit ? 'Editar canal' : 'Novo canal'}</DialogTitle>
          <DialogDescription className='mt-1'>
            {isEdit
              ? 'Atualize o ajuste e a disponibilidade deste canal.'
              : 'Defina como os preços serão ajustados.'}
          </DialogDescription>
        </DialogHeader>
        <form className='grid gap-4 p-6' noValidate onSubmit={handleSubmit}>
          <Label className='grid gap-2 text-sm font-bold' htmlFor='sales-channel-name'>
            Nome do canal
            <Input
              {...register('name')}
              aria-describedby={nameFieldError ? 'sales-channel-name-error' : undefined}
              aria-invalid={Boolean(nameFieldError)}
              id='sales-channel-name'
              placeholder='Ex: Delivery próprio'
            />
            {nameFieldError ? (
              <span
                className='text-sm font-semibold text-destructive'
                id='sales-channel-name-error'
              >
                {nameFieldError}
              </span>
            ) : null}
          </Label>
          <div className={isEdit ? 'grid gap-4 sm:grid-cols-[1fr_1.2fr]' : undefined}>
            <Label
              className='grid gap-2 text-sm font-bold'
              htmlFor='sales-channel-percentage'
            >
              Percentual de ajuste
              <span className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <Input
                  {...register('percentage')}
                  aria-describedby={
                    percentageFieldError ? 'sales-channel-percentage-error' : undefined
                  }
                  aria-invalid={Boolean(percentageFieldError)}
                  className='border-0 shadow-none focus-visible:border-0 focus-visible:ring-0'
                  data-focus-ring='delegated'
                  id='sales-channel-percentage'
                  inputMode='decimal'
                  placeholder='0,00'
                />
                <span className='grid w-10 shrink-0 place-items-center border-l bg-muted text-sm font-extrabold text-muted-foreground'>
                  %
                </span>
              </span>
              {percentageFieldError ? (
                <span
                  className='text-sm font-semibold text-destructive'
                  id='sales-channel-percentage-error'
                >
                  {percentageFieldError}
                </span>
              ) : null}
            </Label>
            <Label className='grid gap-2 text-sm font-bold'>
              Status
              <span className='flex min-h-12 items-center gap-3 rounded-xl border px-3'>
                <input
                  aria-label='Status do canal'
                  aria-checked={currentStatus === 'active'}
                  checked={currentStatus === 'active'}
                  className='peer sr-only'
                  disabled={isPending}
                  onChange={(event) =>
                    handleStatusChange(
                      event.target.checked
                        ? 'active'
                        : ('inactive' as SalesChannelStatus),
                    )
                  }
                  role='switch'
                  type='checkbox'
                />
                <span
                  aria-hidden='true'
                  className={`pointer-events-none relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 ${currentStatus === 'active' ? 'bg-success' : 'bg-border'}`}
                >
                  <span
                    className={`absolute top-1 size-5 rounded-full bg-white transition-transform ${currentStatus === 'active' ? 'translate-x-6' : 'left-1'}`}
                  />
                </span>
                <span>{currentStatus === 'active' ? 'Ativo' : 'Inativo'}</span>
              </span>
            </Label>
          </div>
          <section aria-label='Prévia do ajuste' className='rounded-xl bg-muted p-4'>
            <div className='flex items-end justify-between gap-4'>
              <div>
                <p className='text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground'>
                  Tipo
                </p>
                <p className={`mt-1 text-lg font-extrabold ${adjustmentColor}`}>
                  {adjustedExample === 20
                    ? '0%'
                    : `${adjustedExample > 20 ? '+' : '−'}${Math.abs(
                        (adjustedExample / 20 - 1) * 100,
                      )
                        .toFixed(2)
                        .replace('.', ',')}%`}{' '}
                  · {adjustmentType}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-[11px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground'>
                  Exemplo em R$ 20
                </p>
                <p className='mt-1 text-lg font-extrabold text-foreground'>
                  R$ 20 → {formatCurrency(adjustedExample)}
                </p>
              </div>
            </div>
          </section>
          {actionError ? (
            <p
              aria-live='assertive'
              className='text-sm font-semibold text-destructive'
              role='alert'
            >
              {actionError}
            </p>
          ) : null}
          <DialogFooter className='-mx-6 -mb-6 border-0 bg-transparent p-6 pt-2'>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type='button'
              variant='outline'
            >
              Cancelar
            </Button>
            <Button disabled={isPending} type='submit'>
              {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar canal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
