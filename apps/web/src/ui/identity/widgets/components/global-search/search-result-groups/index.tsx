import type {
  GlobalSearchHit,
  GlobalSearchResults,
} from '@scoops/core/identity/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'

export type GlobalSearchGroup = {
  key: keyof GlobalSearchResults
  label: string
  hits: GlobalSearchHit[]
}

export type SearchResultGroupsProps = {
  activeIndex: number
  groups: GlobalSearchGroup[]
  listboxId: string
  onNavigate: (hit: GlobalSearchHit) => void
}

function getHitType(hit: GlobalSearchHit) {
  const labels = {
    page: 'Página',
    product: 'Produto',
    order: 'Pedido',
    user: 'Usuário',
    salesChannel: 'Canal de venda',
    discount: 'Desconto',
  }
  return labels[hit.kind]
}

function getHitIcon(hit: GlobalSearchHit) {
  const icons = {
    page: 'layout-dashboard',
    product: 'package',
    order: 'clipboard-list',
    user: 'user-round',
    salesChannel: 'store',
    discount: 'tags',
  } as const
  return icons[hit.kind]
}

function getHitContext(hit: GlobalSearchHit) {
  if (hit.kind === 'page') return ''
  const statusLabel =
    hit.status === 'active'
      ? 'Ativo'
      : hit.status === 'inactive'
        ? 'Inativo'
        : hit.status === 'registered'
          ? 'Registrado'
          : hit.status === 'canceled'
            ? 'Cancelado'
            : hit.status === 'invited' || hit.status === 'pending'
              ? 'Convite pendente'
              : ''
  return hit.kind === 'order' || hit.kind === 'user'
    ? [hit.context, statusLabel].filter(Boolean).join(' · ')
    : statusLabel
}

function getHitKey(hit: GlobalSearchHit) {
  switch (hit.kind) {
    case 'page':
      return hit.pageKey
    case 'product':
      return hit.productId
    case 'order':
      return hit.orderId
    case 'user':
      return hit.userId
    case 'salesChannel':
      return hit.salesChannelId
    case 'discount':
      return hit.discountId
  }
}

export const SearchResultGroups = ({
  activeIndex,
  groups,
  listboxId,
  onNavigate,
}: SearchResultGroupsProps) => {
  let optionIndex = -1

  return (
    <>
      {groups.map((group) => (
        <fieldset aria-label={group.label} className='min-w-0' key={group.key}>
          <legend className='sr-only'>{group.label}</legend>
          <h2 className='px-3 pb-1 pt-3 text-xs font-bold text-muted-foreground'>
            {group.label}
          </h2>
          {group.hits.map((hit) => {
            optionIndex += 1
            const index = optionIndex
            const context = getHitContext(hit)
            return (
              <button
                aria-label={`${getHitType(hit)}: ${hit.label}${context ? `, ${context}` : ''}`}
                aria-selected={activeIndex === index}
                className='flex min-h-16 w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 aria-selected:bg-primary-soft aria-selected:text-primary aria-selected:ring-2 aria-selected:ring-primary'
                id={`${listboxId}-option-${index}`}
                key={`${hit.kind}-${getHitKey(hit)}`}
                onClick={() => onNavigate(hit)}
                role='option'
                type='button'
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-md ${activeIndex === index ? 'bg-card text-primary' : 'text-muted-foreground'}`}
                  data-search-result-icon
                >
                  <Icon className='size-4' name={getHitIcon(hit)} />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-semibold'>
                    {hit.label}
                  </span>
                  {context ? (
                    <span className='block truncate text-xs text-muted-foreground'>
                      {context}
                    </span>
                  ) : null}
                </span>
                <span className='shrink-0 text-[11px] font-semibold text-muted-foreground'>
                  {getHitType(hit)}
                </span>
                <Icon className='size-4 shrink-0 text-tertiary' name='arrow' />
              </button>
            )
          })}
        </fieldset>
      ))}
      <div
        className='border-t border-border-soft px-3 pb-1 pt-2 text-[11px] text-muted-foreground'
        role='presentation'
      >
        ↑↓ navegar <span aria-hidden='true'> · </span> Enter abrir
        <span aria-hidden='true'> · </span> Esc fechar
      </div>
    </>
  )
}
