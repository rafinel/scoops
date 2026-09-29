import type { Product } from '@scoops/core/mrp/domain/entities'

export type ReadOnlySettingsCardProps = {
  product: Product
}

const SETTINGS_LABELS = [
  'Nome do produto',
  'Unidade de estoque',
  'Estoque ideal',
  'Status',
  'Controle de estoque',
  'Permitir estoque negativo',
  'Categorias',
  'Anotações internas',
] as const

function getSettingsValues(product: Product) {
  return [
    product.name,
    product.unit,
    product.idealStock === undefined
      ? 'Não definido'
      : `${product.idealStock} ${product.unit}`,
    product.status === 'active' ? 'Ativo' : 'Inativo',
    product.stockControl === 'by-brand' ? 'Por marca' : 'Único',
    product.allowNegativeStock ? 'Sim' : 'Não',
    product.categories.join(', ') || 'Nenhuma',
    product.internalNotes || 'Nenhuma',
  ]
}

export const ReadOnlySettingsCard = ({ product }: ReadOnlySettingsCardProps) => {
  const values = getSettingsValues(product)

  return (
    <section
      aria-labelledby='product-settings-readonly-title'
      className='rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'
    >
      <h2 className='text-lg font-extrabold' id='product-settings-readonly-title'>
        Configurações do produto
      </h2>
      <dl className='mt-5 grid gap-4 sm:grid-cols-2'>
        {SETTINGS_LABELS.map((label, index) => (
          <div key={label}>
            <dt className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
              {label}
            </dt>
            <dd className='mt-1 font-semibold'>{values[index]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
