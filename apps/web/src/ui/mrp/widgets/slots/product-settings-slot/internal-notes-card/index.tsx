import type { Product } from '@scoops/core/mrp/domain/entities'

import { Label } from '@/ui/shadcn/label'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useInternalNotesCard } from './use-internal-notes-card'

export type InternalNotesCardProps = { product: Product }

export const InternalNotesCard = ({ product }: InternalNotesCardProps) => {
  const state = useInternalNotesCard(product)

  return (
    <section
      aria-labelledby='internal-notes-title'
      className='rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'
    >
      <div className='flex items-start gap-3'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground'>
          <Icon name='clipboard-list' />
        </span>
        <div>
          <h2 className='text-lg font-extrabold' id='internal-notes-title'>
            Anotações internas
          </h2>
        </div>
      </div>
      <Label className='mt-5 grid gap-2 text-sm font-bold'>
        Observação
        <Textarea
          aria-describedby={state.error ? 'internal-notes-error' : undefined}
          aria-invalid={Boolean(state.error)}
          disabled={state.isPending}
          maxLength={2000}
          onBlur={() => void state.handleBlur()}
          onChange={(event) => state.setInternalNotes(event.target.value)}
          placeholder='Adicione uma observação que ajude a equipe.'
          value={state.internalNotes}
        />
        {state.error ? (
          <span
            className='text-sm font-semibold text-danger'
            id='internal-notes-error'
            role='alert'
          >
            {state.error}
          </span>
        ) : null}
      </Label>
      {state.error ? (
        <div className='flex flex-wrap gap-3 text-xs font-bold'>
          <button
            className='text-primary underline-offset-2 hover:underline'
            onClick={state.handleRetry}
            type='button'
          >
            Tentar novamente
          </button>
          <button
            className='text-muted-foreground underline-offset-2 hover:underline'
            onClick={state.handleRevert}
            type='button'
          >
            Reverter
          </button>
        </div>
      ) : null}
      {state.isPending ? (
        <p className='mt-2 text-xs font-semibold text-muted-foreground'>Salvando…</p>
      ) : null}
    </section>
  )
}
