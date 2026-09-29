import type { ComboDetails } from '@scoops/core/pdv/domain/structures'

import { BackLink } from '@/ui/shared/widgets/components/back-link'

export const ReadOnlyComboDetails = ({
  details,
  formatCurrency,
}: {
  details: ComboDetails
  formatCurrency: (value: number) => string
}) => (
  <>
    <header className='flex flex-col gap-3 border-b border-border-soft pb-5 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <BackLink aria-label='Voltar para descontos' route='discounts'>
          Voltar para descontos
        </BackLink>
        <h1 className='mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl'>
          {details.combo.name}
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Detalhes do desconto combinado
        </p>
      </div>
      <span className='rounded-full bg-muted px-3 py-1 text-sm font-bold'>
        {details.combo.status === 'active' ? 'Ativo' : 'Inativo'}
      </span>
    </header>
    <section className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <h2 className='text-lg font-extrabold'>Composição do combo</h2>
      <div className='mt-4 divide-y divide-border-soft'>
        {details.components.map((component) => (
          <div
            className='flex flex-wrap items-center justify-between gap-2 py-3'
            key={`${component.component.kind}-${component.component.productId}-${component.configurationName}`}
          >
            <div>
              <h3 className='font-bold'>{component.productName}</h3>
              <p className='text-sm text-muted-foreground'>
                {component.configurationName}
                {component.accompanimentNames.length
                  ? ` · ${component.accompanimentNames.join(', ')}`
                  : ''}
              </p>
            </div>
            <span className='font-semibold'>{formatCurrency(component.subtotal)}</span>
          </div>
        ))}
      </div>
      <dl className='mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3'>
        <Price label='Preço normal' value={formatCurrency(details.normalPrice)} />
        <Price label='Preço do combo' value={formatCurrency(details.combo.fixedPrice)} />
        <Price label='Economia' value={formatCurrency(details.savings)} />
      </dl>
    </section>
  </>
)

const Price = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className='text-xs font-bold uppercase text-muted-foreground'>{label}</dt>
    <dd className='mt-1 font-bold'>{value}</dd>
  </div>
)
