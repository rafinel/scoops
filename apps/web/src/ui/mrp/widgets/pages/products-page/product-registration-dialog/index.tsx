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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { BrandSection } from './brand-section'
import { useProductRegistrationDialog } from './use-product-registration-dialog'

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
  const {
    allowNegativeStock,
    brands,
    calculatedInitialStock,
    categories,
    currentUnitCost,
    fieldErrors,
    formError,
    idealStock,
    initialStock,
    isPending,
    name,
    stockControl,
    unit,
    handleAddBrand,
    handleAllowNegativeStockChange,
    handleBrandChange,
    handleIdealStockChange,
    handleInitialStockChange,
    handleCurrentUnitCostChange,
    handleNameChange,
    handleProductCategoryToggle,
    handleRegister,
    handleRemoveBrand,
    handleStockControlChange,
    handleUnitChange,
    isCategoryDisabled,
    register,
  } = useProductRegistrationDialog({ onSuccess })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[min(90vh,48rem)] overflow-y-auto sm:max-w-xl'>
        <DialogHeader className='flex-row items-start gap-3 border-b border-border-soft p-6 pr-14'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary'>
            <Icon name='package' className='size-5' />
          </span>
          <div className='min-w-0'>
            <DialogTitle>Novo produto</DialogTitle>
            <DialogDescription className='mt-1'>
              Defina o básico e ajuste o resto depois.
            </DialogDescription>
          </div>
        </DialogHeader>
        <form className='grid gap-5 p-6' noValidate onSubmit={handleRegister}>
          <Label className='grid gap-2 text-sm font-bold'>
            Nome do produto
            <Input
              {...register('name')}
              aria-describedby={fieldErrors.name ? 'product-name-error' : undefined}
              aria-invalid={Boolean(fieldErrors.name)}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder='Ex: Polpa de Açaí'
              value={name}
            />
            {fieldErrors.name ? (
              <p
                className='text-sm font-semibold text-destructive'
                id='product-name-error'
                role='alert'
              >
                {fieldErrors.name}
              </p>
            ) : null}
          </Label>
          <Label className='grid gap-2 text-sm font-bold'>
            Unidade de estoque
            <Select
              value={unit}
              onValueChange={(value) => handleUnitChange(value as ProductUnit)}
            >
              <SelectTrigger
                aria-label='Unidade de estoque'
                className='h-10 w-full rounded-lg bg-background px-3 font-normal'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <fieldset
            aria-describedby={
              fieldErrors.categories ? 'product-categories-error' : undefined
            }
            aria-invalid={Boolean(fieldErrors.categories)}
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
                  className={`flex min-w-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] transition-colors sm:text-sm ${isCategoryDisabled(category) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${categories.includes(category) ? CATEGORY_CHECKBOX_CLASSES[category].selected : 'border-border'}`}
                  key={category}
                >
                  <input
                    checked={categories.includes(category)}
                    className={`size-4 shrink-0 ${CATEGORY_CHECKBOX_CLASSES[category].input}`}
                    disabled={isCategoryDisabled(category)}
                    onChange={() => handleProductCategoryToggle(category)}
                    type='checkbox'
                  />
                  {CATEGORY_LABELS[category]}
                </label>
              ))}
            </div>
            {categories.includes('portion') || categories.includes('resale') ? (
              <p className='mt-2 text-xs text-muted-foreground'>
                Porção e Revenda não podem ser selecionadas juntas.
              </p>
            ) : null}
            {fieldErrors.categories ? (
              <p
                className='mt-2 text-sm font-semibold text-destructive'
                id='product-categories-error'
                role='alert'
              >
                {fieldErrors.categories}
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
                <Button
                  className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${stockControl === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  disabled={value === 'by-brand' && categories.includes('manufacturable')}
                  key={value}
                  onClick={() => handleStockControlChange(value as ProductStockControl)}
                  variant='ghost'
                  type='button'
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className='mt-2 text-xs text-muted-foreground'>
              {categories.includes('manufacturable')
                ? 'Produtos fabricáveis usam estoque único.'
                : stockControl === 'by-brand'
                  ? 'O estoque será controlado por marca.'
                  : 'O saldo será controlado diretamente neste produto.'}
            </p>
          </fieldset>
          {stockControl === 'by-brand' ? (
            <BrandSection
              brands={brands}
              unit={unit}
              onAdd={handleAddBrand}
              onChange={handleBrandChange}
              onRemove={handleRemoveBrand}
            />
          ) : null}
          <Label className='grid gap-2 text-sm font-bold'>
            Estoque ideal
            <Input
              {...register('idealStock')}
              aria-describedby={fieldErrors.idealStock ? 'ideal-stock-error' : undefined}
              aria-invalid={Boolean(fieldErrors.idealStock)}
              min='0'
              onChange={(event) => handleIdealStockChange(event.target.value)}
              type='number'
              value={idealStock}
            />
            <span className='font-normal text-muted-foreground'>
              Define quando o produto precisa ser reposto.
            </span>
            {fieldErrors.idealStock ? (
              <p
                className='text-sm font-semibold text-destructive'
                id='ideal-stock-error'
                role='alert'
              >
                {fieldErrors.idealStock}
              </p>
            ) : null}
          </Label>
          <Label className='grid gap-2 text-sm font-bold'>
            Estoque inicial
            <Input
              {...register('initialStock')}
              min='0'
              onChange={(event) => handleInitialStockChange(event.target.value)}
              readOnly={stockControl === 'by-brand'}
              type='number'
              value={stockControl === 'by-brand' ? calculatedInitialStock : initialStock}
            />
            <span className='font-normal text-muted-foreground'>
              {stockControl === 'by-brand'
                ? 'Total calculado a partir das quantidades iniciais das marcas.'
                : 'Informe o saldo disponível no início do controle.'}
            </span>
          </Label>
          {stockControl === 'single' && categories.includes('ingredient') ? (
            <Label className='grid gap-2 text-sm font-bold'>
              Custo unitário atual{' '}
              <span className='font-normal text-muted-foreground'>(opcional)</span>
              <div className='flex overflow-hidden rounded-xl border bg-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <span className='grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground'>
                  R$
                </span>
                <Input
                  {...register('currentUnitCost')}
                  aria-describedby={
                    fieldErrors.currentUnitCost ? 'current-unit-cost-error' : undefined
                  }
                  aria-invalid={Boolean(fieldErrors.currentUnitCost)}
                  className='border-0 shadow-none focus-visible:ring-0'
                  data-focus-ring='delegated'
                  inputMode='decimal'
                  min='0'
                  onChange={(event) => handleCurrentUnitCostChange(event.target.value)}
                  placeholder='0,00'
                  step='any'
                  type='number'
                  value={currentUnitCost}
                />
              </div>
              <span className='font-normal text-muted-foreground'>
                Usado no custo de receitas futuras.
              </span>
              {fieldErrors.currentUnitCost ? (
                <p
                  className='text-sm font-semibold text-destructive'
                  id='current-unit-cost-error'
                  role='alert'
                >
                  {fieldErrors.currentUnitCost}
                </p>
              ) : null}
            </Label>
          ) : null}
          <label className='flex min-h-10 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold'>
            <input
              aria-label='Permitir estoque negativo'
              checked={allowNegativeStock}
              className='peer sr-only'
              onChange={(event) => handleAllowNegativeStockChange(event.target.checked)}
              type='checkbox'
            />
            <span
              aria-hidden='true'
              className={`pointer-events-none relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 ${allowNegativeStock ? 'bg-primary' : 'bg-border'}`}
            >
              <span
                className={`pointer-events-none absolute left-1 top-1 size-5 rounded-full bg-white transition-transform ${allowNegativeStock ? 'translate-x-5' : ''}`}
              />
            </span>
            Permitir estoque negativo
          </label>
          {formError ? (
            <p className='text-sm font-semibold text-destructive' role='alert'>
              {formError}
            </p>
          ) : null}
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type='button' variant='outline'>
              Cancelar
            </Button>
            <Button disabled={isPending} type='submit'>
              {isPending ? 'Criando...' : 'Criar produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
