import { Button } from '@/ui/shadcn/button'
import { PageRefreshStatus } from '@/ui/pdv/widgets/pages/query-refresh-status'
import { BackLink } from '@/ui/shared/widgets/components/back-link'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ComboDiscountPageMode } from '../use-combo-discount-page'

export type ComboDiscountHeaderProps = {
  announcement: string
  hasDetails: boolean
  isRefreshing: boolean
  mode: ComboDiscountPageMode
  onRequestDelete: () => void
}

export const ComboDiscountHeader = (props: ComboDiscountHeaderProps) => (
  <>
    <header className='flex flex-col gap-4 border-b border-border-soft pb-5 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <BackLink
          aria-label='Voltar para descontos'
          className='-ml-2 mb-3'
          route='discounts'
        >
          Voltar para descontos
        </BackLink>
        <h1 className='mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl'>
          {props.mode === 'create' ? 'Adicionar desconto' : 'Editar desconto'}
        </h1>
        <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
          {props.mode === 'create'
            ? 'Configure os produtos e o preço especial do Combo.'
            : 'Atualize a composição, o preço e o status do Combo.'}
        </p>
      </div>
      {props.mode === 'edit' && props.hasDetails ? (
        <div className='flex flex-wrap gap-2'>
          <Button onClick={props.onRequestDelete} type='button' variant='destructive'>
            <Icon name='trash-2' /> Excluir
          </Button>
        </div>
      ) : null}
    </header>
    <div aria-live='polite' className='sr-only'>
      {props.announcement}
    </div>
    <PageRefreshStatus isRefreshing={props.isRefreshing} label='Atualizando combo…' />
  </>
)
