import type {
  ProductCategory,
  ProductStockControl,
  ProductUnit,
} from '@scoops/core/mrp/domain/structures'

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
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  type BrandDraft,
  useProductRegistrationDialog,
} from './use-product-registration-dialog'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}

const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

const UNIT_OPTIONS: Array<{ value: ProductUnit; label: string }> = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'un', label: 'Unidades (un)' },
]

const CATEGORY_CHECKBOX_CLASSES: Record<
  ProductCategory,
  { input: string; selected: string }
> = {
  ingredient: {
    input: 'accent-blue-600',
    selected: 'border-blue-300 bg-blue-50 font-bold text-blue-700',
  },
  manufacturable: {
    input: 'accent-violet-600',
    selected: 'border-violet-300 bg-violet-50 font-bold text-violet-700',
  },
  portion: {
    input: 'accent-green-600',
    selected: 'border-green-300 bg-green-50 font-bold text-green-700',
  },
  accompaniment: {
    input: 'accent-amber-500',
    selected: 'border-amber-300 bg-amber-50 font-bold text-amber-700',
  },
  resale: {
    input: 'accent-red-600',
    selected: 'border-red-300 bg-red-50 font-bold text-red-700',
  },
}

export type ProductRegistrationDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const ProductRegistrationDialog = ({
  isOpen,
  onOpenChange,
  onSuccess,
}: ProductRegistrationDialogProps) => {
  const form = useProductRegistrationDialog({ onSuccess })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[min(90vh,48rem)] overflow-y-auto sm:max-w-xl'>
        <DialogHeader className='border-b border-border-soft p-6'>
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>Defina o básico e ajuste o resto depois.</DialogDescription>
        </DialogHeader>
        <form className='grid gap-5 p-6' noValidate onSubmit={form.handleRegister}>
          <Label className='grid gap-2 text-sm font-bold'>
            Nome do produto
            <Input
              {...form.register('name')}
              aria-describedby={form.fieldErrors.name ? 'product-name-error' : undefined}
              aria-invalid={Boolean(form.fieldErrors.name)}
              onChange={(event) => form.handleNameChange(event.target.value)}
              placeholder='Ex: Polpa de Açaí'
              value={form.name}
            />
            {form.fieldErrors.name ? (
              <p
                className='text-sm font-semibold text-destructive'
                id='product-name-error'
                role='alert'
              >
                {form.fieldErrors.name}
              </p>
            ) : null}
          </Label>
          <Label className='grid gap-2 text-sm font-bold'>
            Unidade de estoque
            <select
              {...form.register('unit')}
              className='h-10 rounded-lg border bg-background px-3 font-normal'
              onChange={(event) =>
                form.handleUnitChange(event.target.value as ProductUnit)
              }
              value={form.unit}
            >
              {UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Label>
          <fieldset
            aria-describedby={
              form.fieldErrors.categories ? 'product-categories-error' : undefined
            }
            aria-invalid={Boolean(form.fieldErrors.categories)}
          >
            <legend className='mb-3 text-sm font-bold'>
              Categorias{' '}
              <span className='font-normal text-muted-foreground'>
                (selecione uma ou mais)
              </span>
            </legend>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
              {CATEGORY_VALUES.map((category) => (
                <label
                  className={`flex min-w-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] transition-colors sm:text-sm ${form.isCategoryDisabled(category) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${form.categories.includes(category) ? CATEGORY_CHECKBOX_CLASSES[category].selected : 'border-border'}`}
                  key={category}
                >
                  <input
                    checked={form.categories.includes(category)}
                    className={`size-4 shrink-0 ${CATEGORY_CHECKBOX_CLASSES[category].input}`}
                    disabled={form.isCategoryDisabled(category)}
                    onChange={() => form.handleProductCategoryToggle(category)}
                    type='checkbox'
                  />
                  {CATEGORY_LABELS[category]}
                </label>
              ))}
            </div>
            {form.categories.includes('portion') || form.categories.includes('resale') ? (
              <p className='mt-2 text-xs text-muted-foreground'>
                Porção e Revenda não podem ser selecionadas juntas.
              </p>
            ) : null}
            {form.fieldErrors.categories ? (
              <p
                className='mt-2 text-sm font-semibold text-destructive'
                id='product-categories-error'
                role='alert'
              >
                {form.fieldErrors.categories}
              </p>
            ) : null}
          </fieldset>
          <fieldset>
            <legend className='mb-2 text-sm font-bold'>Controle de estoque</legend>
            <div className='grid grid-cols-2 overflow-hidden rounded-lg border bg-muted/50 p-0.5'>
              {[
                ['single', 'Estoque único'],
                ['by-brand', 'Por marca'],
              ].map(([value, label]) => (
                <button
                  className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${form.stockControl === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  disabled={
                    value === 'by-brand' && form.categories.includes('manufacturable')
                  }
                  key={value}
                  onClick={() =>
                    form.handleStockControlChange(value as ProductStockControl)
                  }
                  type='button'
                >
                  {label}
                </button>
              ))}
            </div>
            <p className='mt-2 text-xs text-muted-foreground'>
              {form.categories.includes('manufacturable')
                ? 'Produtos fabricáveis usam estoque único.'
                : form.stockControl === 'by-brand'
                  ? 'O estoque será controlado por marca.'
                  : 'O saldo será controlado diretamente neste produto.'}
            </p>
          </fieldset>
          {form.stockControl === 'by-brand' ? (
            <BrandSection
              brands={form.brands}
              unit={form.unit}
              onAdd={form.handleAddBrand}
              onChange={form.handleBrandChange}
              onRemove={form.handleRemoveBrand}
            />
          ) : null}
          <Label className='grid gap-2 text-sm font-bold'>
            Estoque ideal
            <Input
              {...form.register('idealStock')}
              aria-describedby={
                form.fieldErrors.idealStock ? 'ideal-stock-error' : undefined
              }
              aria-invalid={Boolean(form.fieldErrors.idealStock)}
              min='0'
              onChange={(event) => form.handleIdealStockChange(event.target.value)}
              type='number'
              value={form.idealStock}
            />
            <span className='font-normal text-muted-foreground'>
              Define quando o produto precisa ser reposto.
            </span>
            {form.fieldErrors.idealStock ? (
              <p
                className='text-sm font-semibold text-destructive'
                id='ideal-stock-error'
                role='alert'
              >
                {form.fieldErrors.idealStock}
              </p>
            ) : null}
          </Label>
          <Label className='grid gap-2 text-sm font-bold'>
            Estoque inicial
            <Input
              {...form.register('initialStock')}
              min='0'
              onChange={(event) => form.handleInitialStockChange(event.target.value)}
              readOnly={form.stockControl === 'by-brand'}
              type='number'
              value={
                form.stockControl === 'by-brand'
                  ? form.calculatedInitialStock
                  : form.initialStock
              }
            />
            <span className='font-normal text-muted-foreground'>
              {form.stockControl === 'by-brand'
                ? 'Total calculado a partir das quantidades iniciais das marcas.'
                : 'Informe o saldo disponível no início do controle.'}
            </span>
          </Label>
          <label className='flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold'>
            <input
              aria-label='Permitir estoque negativo'
              checked={form.allowNegativeStock}
              className='peer sr-only'
              onChange={(event) =>
                form.handleAllowNegativeStockChange(event.target.checked)
              }
              type='checkbox'
            />
            <span
              aria-hidden='true'
              className={`pointer-events-none relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 ${form.allowNegativeStock ? 'bg-primary' : 'bg-border'}`}
            >
              <span
                className={`pointer-events-none absolute left-1 top-1 size-5 rounded-full bg-white transition-transform ${form.allowNegativeStock ? 'translate-x-5' : ''}`}
              />
            </span>
            Permitir estoque negativo
          </label>
          {form.formError ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              {form.formError}
            </p>
          ) : null}
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type='button' variant='outline'>
              Cancelar
            </Button>
            <Button disabled={form.isPending} type='submit'>
              {form.isPending ? 'Criando...' : 'Criar produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BrandSection({
  brands,
  onAdd,
  onChange,
  onRemove,
  unit,
}: {
  brands: BrandDraft[]
  onAdd: () => void
  onChange: (brandId: string, changes: Partial<BrandDraft>) => void
  onRemove: (brandId: string) => void
  unit: ProductUnit
}) {
  return (
    <section className='space-y-4 rounded-2xl border bg-muted/30 p-5'>
      <div>
        <h3 className='flex items-center gap-2 text-base font-extrabold'>
          <Icon name='tags' className='size-5 text-foreground' />
          Marcas do produto
        </h3>
        <p className='mt-2 flex items-center gap-2 text-sm text-muted-foreground'>
          <Icon name='info' className='size-4 shrink-0' />
          <span>Todas as marcas usam a unidade do produto ({unit}).</span>
        </p>
      </div>
      <div className='space-y-4'>
        {brands.map((brand, index) => (
          <BrandEditor
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
}

function BrandEditor({
  brand,
  index,
  onChange,
  onRemove,
  unit,
}: {
  brand: BrandDraft
  index: number
  onChange: (changes: Partial<BrandDraft>) => void
  onRemove: () => void
  unit: ProductUnit
}) {
  return (
    <div className='rounded-2xl border bg-card p-5'>
      <div className='mb-4 flex items-center justify-between'>
        <span className='grid size-7 place-items-center rounded-full bg-accent text-sm font-bold text-primary'>
          {index + 1}
        </span>
        <button
          aria-label={`Remover marca ${index + 1}`}
          className='rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40'
          disabled={index === 0}
          onClick={onRemove}
          type='button'
        >
          <Icon name='trash-2' className='size-4' />
        </button>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Label className='grid gap-2 text-sm font-semibold text-muted-foreground'>
          Nome
          <Input
            className='h-10 rounded-xl px-3 text-sm'
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder='Ex: Frooty'
            value={brand.name}
          />
        </Label>
        <Label className='grid gap-2 text-sm font-semibold text-muted-foreground'>
          Qtd. por embalagem
          <div className='flex h-10 items-center rounded-xl border bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <Input
              className='h-full border-0 px-3 text-sm shadow-none focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0'
              data-focus-ring='delegated'
              min='0'
              onChange={(event) => onChange({ packageQuantity: event.target.value })}
              type='number'
              value={brand.packageQuantity}
            />
            <span className='h-full shrink-0 whitespace-nowrap border-l bg-muted/30 px-3 py-2 text-sm font-semibold text-muted-foreground'>
              {unit}
            </span>
          </div>
        </Label>
        <Label className='grid gap-2 text-sm font-semibold text-muted-foreground sm:col-span-2'>
          Valor por embalagem
          <div className='flex h-10 items-center rounded-xl border bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
            <span className='h-full shrink-0 whitespace-nowrap border-r bg-muted/30 px-3 py-2 text-sm font-semibold text-muted-foreground'>
              R$
            </span>
            <Input
              className='h-full min-w-0 flex-1 border-0 px-3 text-sm shadow-none focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0'
              data-focus-ring='delegated'
              onChange={(event) => onChange({ packagePrice: event.target.value })}
              value={brand.packagePrice}
            />
          </div>
        </Label>
        <Label className='grid gap-2 text-sm font-semibold text-muted-foreground sm:col-span-2'>
          Quantidade de embalagens
          <Input
            className='h-10 rounded-xl px-3 text-sm'
            min='0'
            onChange={(event) => onChange({ packageCount: event.target.value })}
            type='number'
            value={brand.packageCount}
          />
        </Label>
      </div>
      <label className='mt-4 flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold'>
        <input
          checked={brand.isPrimary}
          className='peer sr-only'
          onChange={() => onChange({ isPrimary: !brand.isPrimary })}
          type='checkbox'
        />
        <span
          aria-hidden='true'
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 ${brand.isPrimary ? 'bg-primary' : 'bg-border'}`}
        >
          <span
            className={`absolute left-1 top-1 size-5 rounded-full bg-white transition-transform ${brand.isPrimary ? 'translate-x-5' : ''}`}
          />
        </span>
        Marca principal
      </label>
    </div>
  )
}
