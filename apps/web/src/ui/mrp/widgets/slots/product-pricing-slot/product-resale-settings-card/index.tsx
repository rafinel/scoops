import type { ProductPricingDetails } from '@scoops/core/mrp/domain/structures'

import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'

import { NoResaleBrandsState, ReadOnlyResaleList } from './read-only-resale-list'
import { ResaleSettingsRow } from './resale-settings-row'
import { useProductResaleSettingsCard } from './use-product-resale-settings-card'

export type ProductResaleSettingsCardProps = {
  canManage?: boolean
  details: ProductPricingDetails
  productId: string
}

export const ProductResaleSettingsCard = ({
  canManage = true,
  details,
  productId,
}: ProductResaleSettingsCardProps) => {
  const { handleSave, handleValueChange, rows } = useProductResaleSettingsCard(
    details,
    productId,
  )
  const formatQuantity = useFormatQuantity()
  const formatCurrency = useFormatCurrency()
  const isSingle = details.mode === 'resale-single'

  return (
    <section className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <div>
        <h2 className='text-lg font-extrabold'>Preço de Revenda</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {isSingle
            ? 'O produto é vendido avulso como uma unidade da unidade de estoque.'
            : 'Cada marca é vendida avulsa como uma unidade da embalagem cadastrada.'}
        </p>
      </div>
      {!canManage ? (
        <ReadOnlyResaleList
          formatCurrency={formatCurrency}
          formatQuantity={formatQuantity}
          items={details.resale}
        />
      ) : isSingle ? (
        <ResaleSettingsRow
          isSingle
          item={details.resale[0]}
          onSave={() => void handleSave('single')}
          onValueChange={(field, value) => handleValueChange('single', field, value)}
          row={rows.single}
        />
      ) : details.resale.length === 0 ? (
        <NoResaleBrandsState />
      ) : (
        <div className='mt-6 grid gap-3'>
          {details.resale.map((item) => {
            const key = item.brand?.id ?? 'missing-brand'
            return (
              <ResaleSettingsRow
                description='A embalagem é herdada do cadastro atual da marca.'
                item={item}
                key={key}
                label={item.brand?.name ?? 'Marca'}
                onSave={() => void handleSave(key)}
                onValueChange={(field, value) => handleValueChange(key, field, value)}
                row={rows[key]}
                unitLabel={
                  item.brand
                    ? formatQuantity(item.packageQuantity, 'un').replace(
                        ' un',
                        ' por venda',
                      )
                    : ''
                }
                isSingle={false}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
