import type { ProductUnit } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { BrandEditor } from '../brand-editor'
import type { BrandDraft } from '../use-product-registration-dialog'

export type BrandSectionProps = {
  allowNegativeStock: boolean
  brands: BrandDraft[]
  onAdd: () => void
  onChange: (brandId: string, changes: Partial<BrandDraft>) => void
  onRemove: (brandId: string) => void
  unit: ProductUnit
}

export const BrandSection = ({
  allowNegativeStock,
  brands,
  onAdd,
  onChange,
  onRemove,
  unit,
}: BrandSectionProps) => (
  <section className='space-y-4 rounded-2xl border bg-muted/30 p-5'>
    <div>
      <h3 className='flex items-center gap-2 text-base font-extrabold'>
        <Icon name='tags' className='size-5 text-foreground' />
        Marcas do produto
      </h3>
      <p className='mt-2 flex items-center gap-2 text-sm text-muted-foreground'>
        <Icon name='info' className='size-4 shrink-0' />
        <span>
          Cada marca começa com a unidade do produto ({unit}), mas pode usar outra
          unidade.
        </span>
      </p>
    </div>
    <div className='space-y-4'>
      {brands.map((brand, index) => (
        <BrandEditor
          allowNegativeStock={allowNegativeStock}
          brand={brand}
          index={index}
          key={brand.id}
          onChange={(changes) => onChange(brand.id, changes)}
          onRemove={() => onRemove(brand.id)}
          unit={unit}
        />
      ))}
    </div>
    <Button
      className='h-10 w-full rounded-xl border-primary px-4 text-sm text-primary'
      onClick={onAdd}
      type='button'
      variant='outline'
    >
      <Icon name='plus' className='size-3.5' /> Adicionar marca
    </Button>
  </section>
)
