import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ProductSizeFieldsModel } from '../use-product-registration-page'
import { ProductSizeRow } from './product-size-row'

const SIZES_HINT = 'Opcional. Sem um tamanho ativo, a porção fica indisponível no PDV.'

export type ProductSizeFieldsProps = ProductSizeFieldsModel

export const ProductSizeFields = ({
  onAddSize,
  onRemoveSize,
  onSizeChange,
  sizeErrors,
  sizes,
  unit,
}: ProductSizeFieldsProps) => (
  <Card className='py-0'>
    <CardContent className='grid gap-3 p-3.5'>
      <div className='grid gap-0.5'>
        <h2 className='text-sm font-extrabold'>Tamanhos e preços</h2>
        <p className='text-xs text-muted-foreground'>{SIZES_HINT}</p>
      </div>
      {sizes.map((size, index) => (
        <ProductSizeRow
          errors={sizeErrors[index]}
          index={index}
          key={size.id}
          onChange={onSizeChange}
          onRemove={onRemoveSize}
          size={size}
          unit={unit}
        />
      ))}
      <Button
        className='justify-self-start text-xs font-bold text-primary'
        onClick={onAddSize}
        size='sm'
        type='button'
        variant='outline'
      >
        <Icon className='size-3.5' name='plus' /> Adicionar tamanho
      </Button>
    </CardContent>
  </Card>
)
