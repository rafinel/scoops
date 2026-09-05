import type {
  ProductCategory,
  ProductStockControl,
} from '@scoops/core/mrp/domain/structures'
import type { UseFormRegister } from 'react-hook-form'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type {
  BrandDraft,
  ProductRegistrationFieldErrors,
  ProductRegistrationFormValues,
} from '../use-product-registration-page'
import { ProductBrandEditor, type ProductBrandEditorProps } from './product-brand-editor'

export type ProductStockControlCardProps = {
  allowNegativeStock: boolean
  brandErrors?: Array<ProductBrandEditorProps['errors']>
  brands: BrandDraft[]
  calculatedInitialStock: number
  categories: ProductCategory[]
  currentUnitCost: string
  fieldErrors: ProductRegistrationFieldErrors
  idealStock: string
  initialStock: string
  onAddBrand: () => void
  onAllowNegativeStockChange: (value: boolean) => void
  onBrandChange: (brandId: string, changes: Partial<BrandDraft>) => void
  onCurrentUnitCostChange: (value: string) => void
  onIdealStockChange: (value: string) => void
  onInitialStockChange: (value: string) => void
  onPrimaryBrandChange: (brandId: string) => void
  onRemoveBrand: (brandId: string) => void
  onStockControlChange: (value: ProductStockControl) => void
  register: UseFormRegister<ProductRegistrationFormValues>
  stockControl: ProductStockControl
}

export const ProductStockControlCard = ({
  allowNegativeStock,
  brandErrors,
  brands,
  calculatedInitialStock,
  categories,
  currentUnitCost,
  fieldErrors,
  idealStock,
  initialStock,
  onAddBrand,
  onAllowNegativeStockChange,
  onBrandChange,
  onCurrentUnitCostChange,
  onIdealStockChange,
  onInitialStockChange,
  onPrimaryBrandChange,
  onRemoveBrand,
  onStockControlChange,
  register,
  stockControl,
}: ProductStockControlCardProps) => (
  <section className='rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
    <h2 className='sr-only'>Controle de estoque</h2>
    <div className='grid grid-cols-2 rounded-xl bg-muted/60 p-1'>
      {[
        ['single', 'Estoque único'],
        ['by-brand', 'Por marca'],
      ].map(([value, label]) => (
        <Button
          aria-pressed={stockControl === value}
          className={`min-w-0 rounded-lg px-3 py-2 text-sm font-bold ${stockControl === value ? ' text-foreground shadow-sm' : 'text-muted-foreground'}`}
          disabled={value === 'by-brand' && categories.includes('manufacturable')}
          key={value}
          onClick={() => onStockControlChange(value as ProductStockControl)}
          type='button'
          variant='ghost'
        >
          {label}
        </Button>
      ))}
    </div>
    <div className='mt-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-3'>
      <div>
        <p className='text-sm font-bold'>Permitir estoque negativo</p>
        <p className='text-xs text-muted-foreground'>
          {allowNegativeStock
            ? 'Permite registrar saídas acima do saldo disponível'
            : 'Desativado'}
        </p>
      </div>
      <label className='shrink-0'>
        <span className='sr-only'>Permitir estoque negativo</span>
        <input
          aria-label='Permitir estoque negativo'
          checked={allowNegativeStock}
          className='peer sr-only'
          onChange={(event) => onAllowNegativeStockChange(event.target.checked)}
          type='checkbox'
        />
        <span
          aria-hidden='true'
          className={`relative block h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 ${allowNegativeStock ? 'bg-primary' : 'bg-border'}`}
        >
          <span
            className={`absolute left-1 top-1 size-4 rounded-full bg-white transition-transform ${allowNegativeStock ? 'translate-x-5' : ''}`}
          />
        </span>
      </label>
    </div>
    {stockControl === 'by-brand' ? (
      <div className='mt-3 space-y-3'>
        {brands.map((brand, index) => (
          <ProductBrandEditor
            allowNegativeStock={allowNegativeStock}
            brand={brand}
            canRemove={brands.length > 1}
            errors={brandErrors?.[index]}
            index={index}
            key={brand.id}
            onChange={(changes) => onBrandChange(brand.id, changes)}
            onPrimaryChange={() => onPrimaryBrandChange(brand.id)}
            onRemove={() => onRemoveBrand(brand.id)}
          />
        ))}
        {fieldErrors.brands ? (
          <p className='text-sm font-semibold text-destructive' role='alert'>
            {fieldErrors.brands}
          </p>
        ) : null}
        <Button
          className='h-10 w-full rounded-xl border-primary text-primary'
          onClick={onAddBrand}
          type='button'
          variant='outline'
        >
          <Icon name='plus' className='size-4' /> Adicionar outra marca
        </Button>
      </div>
    ) : (
      <div className='mt-3 grid gap-3 sm:grid-cols-2'>
        <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
          Estoque inicial
          <Input
            {...register('initialStock')}
            aria-describedby={
              fieldErrors.initialStock ? 'initial-stock-error' : undefined
            }
            aria-invalid={Boolean(fieldErrors.initialStock)}
            className='h-10 rounded-xl  px-3 text-sm'
            min={allowNegativeStock ? undefined : '0'}
            onChange={(event) => onInitialStockChange(event.target.value)}
            type='number'
            value={initialStock}
          />
          {fieldErrors.initialStock ? (
            <span className='text-sm text-destructive' id='initial-stock-error'>
              {fieldErrors.initialStock}
            </span>
          ) : null}
        </Label>
        <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
          Estoque ideal
          <Input
            {...register('idealStock')}
            aria-describedby={fieldErrors.idealStock ? 'ideal-stock-error' : undefined}
            aria-invalid={Boolean(fieldErrors.idealStock)}
            className='h-10 rounded-xl  px-3 text-sm'
            min='0'
            onChange={(event) => onIdealStockChange(event.target.value)}
            type='number'
            value={idealStock}
          />
          {fieldErrors.idealStock ? (
            <span className='text-sm text-destructive' id='ideal-stock-error'>
              {fieldErrors.idealStock}
            </span>
          ) : null}
        </Label>
      </div>
    )}
    {stockControl === 'by-brand' ? (
      <div className='mt-3 grid gap-3 sm:grid-cols-2'>
        <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
          Estoque inicial
          <Input
            className='h-10 rounded-xl  px-3 text-sm'
            readOnly
            value={calculatedInitialStock}
          />
          <span className='font-normal'>
            Total calculado pelas quantidades iniciais das marcas.
          </span>
        </Label>
        <Label className='grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
          Estoque ideal
          <Input
            {...register('idealStock')}
            aria-describedby={fieldErrors.idealStock ? 'ideal-stock-error' : undefined}
            aria-invalid={Boolean(fieldErrors.idealStock)}
            className='h-10 rounded-xl  px-3 text-sm'
            min='0'
            onChange={(event) => onIdealStockChange(event.target.value)}
            type='number'
            value={idealStock}
          />
          {fieldErrors.idealStock ? (
            <span className='text-sm text-destructive' id='ideal-stock-error'>
              {fieldErrors.idealStock}
            </span>
          ) : null}
        </Label>
      </div>
    ) : null}
    {stockControl === 'single' && categories.includes('ingredient') ? (
      <Label className='mt-3 grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'>
        <span>
          Custo unitário atual <span className='block font-normal'>(opcional)</span>
        </span>
        <div className='flex min-w-0 overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
          <span className='grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground'>
            R$
          </span>
          <Input
            {...register('currentUnitCost')}
            aria-describedby={
              fieldErrors.currentUnitCost ? 'current-unit-cost-error' : undefined
            }
            aria-invalid={Boolean(fieldErrors.currentUnitCost)}
            className='h-10 min-w-0 flex-1 border-0 px-3 shadow-none focus-visible:ring-0'
            data-focus-ring='delegated'
            inputMode='decimal'
            min='0'
            onChange={(event) => onCurrentUnitCostChange(event.target.value)}
            placeholder='0,00'
            step='any'
            type='number'
            value={currentUnitCost}
          />
        </div>
        <span className='font-normal'>Usado no custo de receitas futuras.</span>
        {fieldErrors.currentUnitCost ? (
          <span className='text-sm text-destructive' id='current-unit-cost-error'>
            {fieldErrors.currentUnitCost}
          </span>
        ) : null}
      </Label>
    ) : null}
  </section>
)
