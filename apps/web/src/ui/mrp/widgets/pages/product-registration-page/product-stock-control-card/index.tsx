import { useState, type ChangeEvent } from 'react'
import type {
  ProductCategory,
  ProductStockControl,
} from '@scoops/core/mrp/domain/structures'
import type { UseFormRegister } from 'react-hook-form'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { StockControlGuidanceDialog } from '../stock-control-guidance-dialog'
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
  <section className={STOCK_CONTROL_CARD_CLASS}>
    <div className={STOCK_CONTROL_HEADER_CLASS}>
      <h2 className={STOCK_CONTROL_TITLE_CLASS}>Estoque</h2>
      <StockControlGuidanceHelp />
    </div>
    <div className={STOCK_CONTROL_OPTIONS_CLASS}>
      {STOCK_CONTROL_OPTIONS.map(([value, label]) => (
        <StockControlOption
          key={value}
          value={value}
          label={label}
          selected={stockControl === value}
          disabled={matchesStockControlCategory(
            value,
            'by-brand',
            'manufacturable',
            categories,
          )}
          onSelect={onStockControlChange}
        />
      ))}
    </div>
    <div className={ALLOW_NEGATIVE_STOCK_ROW_CLASS}>
      <div>
        <p className={ALLOW_NEGATIVE_STOCK_LABEL_CLASS}>{ALLOW_NEGATIVE_STOCK_LABEL}</p>
        <p className={ALLOW_NEGATIVE_STOCK_DESCRIPTION_CLASS}>
          {ALLOW_NEGATIVE_STOCK_PRESENTATIONS[Number(allowNegativeStock)].description}
        </p>
      </div>
      <AllowNegativeStockToggle
        allowNegativeStock={allowNegativeStock}
        onChange={onAllowNegativeStockChange}
        presentation={ALLOW_NEGATIVE_STOCK_PRESENTATIONS[Number(allowNegativeStock)]}
      />
    </div>
    {stockControl === 'by-brand' ? (
      <BrandControls
        allowNegativeStock={allowNegativeStock}
        brandErrors={brandErrors}
        brands={brands}
        fieldErrors={fieldErrors}
        onAddBrand={onAddBrand}
        onBrandChange={onBrandChange}
        onPrimaryBrandChange={onPrimaryBrandChange}
        onRemoveBrand={onRemoveBrand}
      />
    ) : (
      <SingleStockFields
        allowNegativeStock={allowNegativeStock}
        fieldErrors={fieldErrors}
        initialStock={initialStock}
        idealStock={idealStock}
        onIdealStockChange={onIdealStockChange}
        onInitialStockChange={onInitialStockChange}
        register={register}
      />
    )}
    {stockControl === 'by-brand' ? (
      <BrandIdealStockFields
        calculatedInitialStock={calculatedInitialStock}
        error={fieldErrors.idealStock}
        idealStock={idealStock}
        onIdealStockChange={onIdealStockChange}
        register={register}
      />
    ) : null}
    {matchesStockControlCategory(stockControl, 'single', 'ingredient', categories) ? (
      <CurrentUnitCostField
        currentUnitCost={currentUnitCost}
        error={fieldErrors.currentUnitCost}
        onCurrentUnitCostChange={onCurrentUnitCostChange}
        register={register}
      />
    ) : null}
  </section>
)

const StockControlGuidanceHelp = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button {...STOCK_GUIDANCE_BUTTON_PROPS} onClick={() => setOpen(true)}>
        <Icon className={STOCK_GUIDANCE_ICON_CLASS} name='info' /> Entenda o estoque
      </Button>
      <StockControlGuidanceDialog onOpenChange={setOpen} open={open} />
    </>
  )
}

const STOCK_CONTROL_OPTIONS = [
  ['single', 'Estoque único'],
  ['by-brand', 'Por marca'],
] as const
const STOCK_CONTROL_CARD_CLASS =
  'rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'
const STOCK_CONTROL_HEADER_CLASS = 'mb-3 flex items-center justify-between gap-3'
const STOCK_CONTROL_TITLE_CLASS = 'text-sm font-extrabold'
const STOCK_CONTROL_OPTIONS_CLASS = 'grid grid-cols-2 rounded-xl bg-muted/60 p-1'
const STOCK_CONTROL_OPTION_BASE_CLASS = 'min-w-0 rounded-lg px-3 py-2 text-sm font-bold'
const STOCK_CONTROL_OPTION_SELECTED_CLASS = ' text-foreground shadow-sm'
const STOCK_CONTROL_OPTION_UNSELECTED_CLASS = 'text-muted-foreground'
const ALLOW_NEGATIVE_STOCK_ROW_CLASS =
  'mt-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-3'
const ALLOW_NEGATIVE_STOCK_LABEL_CLASS = 'text-sm font-bold'
const ALLOW_NEGATIVE_STOCK_DESCRIPTION_CLASS = 'text-xs text-muted-foreground'
const ALLOW_NEGATIVE_STOCK_CONTROL_CLASS = 'shrink-0'
const ALLOW_NEGATIVE_STOCK_INPUT_CLASS = 'peer sr-only'
const ALLOW_NEGATIVE_STOCK_TRACK_BASE_CLASS =
  'relative block h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 '
const ALLOW_NEGATIVE_STOCK_THUMB_BASE_CLASS =
  'absolute left-1 top-1 size-4 rounded-full bg-white transition-transform'
const ALLOW_NEGATIVE_STOCK_ON_CLASS = 'bg-primary'
const ALLOW_NEGATIVE_STOCK_OFF_CLASS = 'bg-border'
const ALLOW_NEGATIVE_STOCK_ENABLED_DESCRIPTION =
  'Permite registrar saídas acima do saldo disponível'
const ALLOW_NEGATIVE_STOCK_DISABLED_DESCRIPTION = 'Desativado'
const ALLOW_NEGATIVE_STOCK_PRESENTATIONS = [
  {
    description: ALLOW_NEGATIVE_STOCK_DISABLED_DESCRIPTION,
    trackClass: `${ALLOW_NEGATIVE_STOCK_TRACK_BASE_CLASS}${ALLOW_NEGATIVE_STOCK_OFF_CLASS}`,
    thumbClass: ALLOW_NEGATIVE_STOCK_THUMB_BASE_CLASS,
  },
  {
    description: ALLOW_NEGATIVE_STOCK_ENABLED_DESCRIPTION,
    trackClass: `${ALLOW_NEGATIVE_STOCK_TRACK_BASE_CLASS}${ALLOW_NEGATIVE_STOCK_ON_CLASS}`,
    thumbClass: `${ALLOW_NEGATIVE_STOCK_THUMB_BASE_CLASS} translate-x-5`,
  },
] as const
const ALLOW_NEGATIVE_STOCK_LABEL = 'Permitir estoque negativo'
const ALLOW_NEGATIVE_STOCK_CHECKBOX_PROPS = {
  'aria-label': ALLOW_NEGATIVE_STOCK_LABEL,
  className: ALLOW_NEGATIVE_STOCK_INPUT_CLASS,
  type: 'checkbox',
} as const
const BRAND_CONTROLS_CLASS = 'mt-3 space-y-3'
const BRAND_FIELD_ERROR_PROPS = { id: 'brand-error', role: 'alert' } as const
const ADD_BRAND_BUTTON_CLASS = 'h-10 w-full rounded-xl border-primary text-primary'
const ADD_BRAND_ICON_CLASS = 'size-4'
const ADD_BRAND_BUTTON_PROPS = {
  className: ADD_BRAND_BUTTON_CLASS,
  type: 'button',
  variant: 'outline',
} as const
const STOCK_GUIDANCE_BUTTON_PROPS = {
  className: 'h-8 shrink-0 gap-1 px-2 text-xs font-bold text-primary',
  type: 'button',
  variant: 'ghost',
} as const
const STOCK_GUIDANCE_ICON_CLASS = 'size-3.5'
const STOCK_FIELDS_GRID_CLASS = 'mt-3 grid items-start gap-3 sm:grid-cols-2'
const SINGLE_STOCK_FIELD_DEFINITIONS = [
  ['initialStock', 'Estoque inicial', 'initial-stock-error', 'onInitialStockChange'],
  ['idealStock', 'Estoque ideal', 'ideal-stock-error', 'onIdealStockChange'],
] as const
const STOCK_FIELD_LABEL_CLASS =
  'grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'
const STOCK_INPUT_CLASS = 'h-10 rounded-xl  px-3 text-sm'
const STOCK_FIELD_ERROR_CLASS = 'text-sm text-destructive'
const STOCK_FIELD_HINT_CLASS = 'font-normal'
const CURRENT_UNIT_COST_LABEL_CLASS =
  'mt-3 grid min-w-0 gap-1.5 text-xs font-semibold text-muted-foreground'
const CURRENT_UNIT_COST_SUBLABEL_CLASS = 'block font-normal'
const CURRENT_UNIT_COST_CONTROL_CLASS =
  'flex min-w-0 overflow-hidden rounded-xl border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'
const CURRENT_UNIT_COST_PREFIX_CLASS =
  'grid shrink-0 place-items-center border-r bg-muted px-3 text-sm font-bold text-muted-foreground'
const CURRENT_UNIT_COST_INPUT_CLASS =
  'h-10 min-w-0 flex-1 border-0 px-3 shadow-none focus-visible:ring-0'
const CURRENT_UNIT_COST_INPUT_PROPS = {
  className: CURRENT_UNIT_COST_INPUT_CLASS,
  'data-focus-ring': 'delegated',
  inputMode: 'decimal',
  min: '0',
  placeholder: '0,00',
  step: 'any',
  type: 'number',
} as const
const CURRENT_UNIT_COST_LABEL = 'Custo unitário atual'
const CURRENT_UNIT_COST_HINT = 'Usado no custo de receitas futuras.'
const CURRENT_UNIT_COST_LABEL_CONTENT = (
  <span>
    {CURRENT_UNIT_COST_LABEL}{' '}
    <span className={CURRENT_UNIT_COST_SUBLABEL_CLASS}>(opcional)</span>
  </span>
)

type StockControlOptionProps = {
  disabled: boolean
  label: string
  onSelect: (value: ProductStockControl) => void
  selected: boolean
  value: ProductStockControl
}

const StockControlOption = ({
  disabled,
  label,
  onSelect,
  selected,
  value,
}: StockControlOptionProps) => (
  <Button
    aria-pressed={selected}
    className={getStockControlModeClass(selected)}
    disabled={disabled}
    onClick={() => onSelect(value)}
    type='button'
    variant='ghost'
  >
    {label}
  </Button>
)

type AllowNegativeStockToggleProps = Pick<
  ProductStockControlCardProps,
  'allowNegativeStock'
> & {
  onChange: ProductStockControlCardProps['onAllowNegativeStockChange']
  presentation: (typeof ALLOW_NEGATIVE_STOCK_PRESENTATIONS)[number]
}

const AllowNegativeStockToggle = ({
  allowNegativeStock,
  onChange,
  presentation,
}: AllowNegativeStockToggleProps) => (
  <label className={ALLOW_NEGATIVE_STOCK_CONTROL_CLASS}>
    <span className='sr-only'>{ALLOW_NEGATIVE_STOCK_LABEL}</span>
    <input
      {...ALLOW_NEGATIVE_STOCK_CHECKBOX_PROPS}
      checked={allowNegativeStock}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span aria-hidden='true' className={presentation.trackClass}>
      <span className={presentation.thumbClass} />
    </span>
  </label>
)

type CurrentUnitCostFieldProps = Pick<
  ProductStockControlCardProps,
  'currentUnitCost' | 'onCurrentUnitCostChange' | 'register'
> & { error?: string }

const CurrentUnitCostField = ({
  currentUnitCost,
  error,
  onCurrentUnitCostChange,
  register,
}: CurrentUnitCostFieldProps) => (
  <Label className={CURRENT_UNIT_COST_LABEL_CLASS}>
    {CURRENT_UNIT_COST_LABEL_CONTENT}
    <div className={CURRENT_UNIT_COST_CONTROL_CLASS}>
      <span className={CURRENT_UNIT_COST_PREFIX_CLASS}>R$</span>
      <Input
        {...register('currentUnitCost')}
        {...CURRENT_UNIT_COST_INPUT_PROPS}
        aria-describedby={error ? 'current-unit-cost-error' : undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => onCurrentUnitCostChange(event.target.value)}
        value={currentUnitCost}
      />
    </div>
    <span className={STOCK_FIELD_HINT_CLASS}>{CURRENT_UNIT_COST_HINT}</span>
    <StockFieldError error={error} id='current-unit-cost-error' />
  </Label>
)

type BrandIdealStockFieldsProps = Pick<
  ProductStockControlCardProps,
  'calculatedInitialStock' | 'idealStock' | 'onIdealStockChange' | 'register'
> & { error?: string }

const BrandIdealStockFields = (props: BrandIdealStockFieldsProps) => (
  <div className={STOCK_FIELDS_GRID_CLASS}>
    <CalculatedStockField value={props.calculatedInitialStock} />
    <StockNumberField
      error={props.error}
      errorId='ideal-stock-error'
      label='Estoque ideal'
      min='0'
      name='idealStock'
      onChange={props.onIdealStockChange}
      register={props.register}
      value={props.idealStock}
    />
  </div>
)

function getStockControlModeClass(isSelected: boolean) {
  return `${STOCK_CONTROL_OPTION_BASE_CLASS} ${isSelected ? STOCK_CONTROL_OPTION_SELECTED_CLASS : STOCK_CONTROL_OPTION_UNSELECTED_CLASS}`
}

function matchesStockControlCategory(
  stockControl: ProductStockControl,
  expectedStockControl: ProductStockControl,
  category: ProductCategory,
  categories: ProductCategory[],
) {
  return stockControl === expectedStockControl && categories.includes(category)
}

type StockNumberFieldProps = Pick<ProductStockControlCardProps, 'register'> & {
  className?: string
  dataFocusRing?: 'delegated'
  error?: string
  errorId: string
  inputMode?: 'decimal'
  label: string
  min?: string
  name: 'idealStock' | 'initialStock'
  onChange: (value: string) => void
  placeholder?: string
  step?: 'any'
  value: string
}

function StockFieldError({
  error,
  id,
  role,
}: {
  error?: string
  id: string
  role?: 'alert'
}) {
  return error ? (
    <span className={STOCK_FIELD_ERROR_CLASS} id={id} role={role}>
      {error}
    </span>
  ) : null
}

const StockNumberInput = (props: StockNumberFieldProps) => (
  <Input
    {...props.register(props.name)}
    aria-describedby={props.error ? props.errorId : undefined}
    aria-invalid={Boolean(props.error)}
    className={props.className ?? STOCK_INPUT_CLASS}
    data-focus-ring={props.dataFocusRing}
    inputMode={props.inputMode}
    min={props.min}
    onChange={(event: ChangeEvent<HTMLInputElement>) =>
      props.onChange(event.target.value)
    }
    type='number'
    placeholder={props.placeholder}
    step={props.step}
    value={props.value}
  />
)

function StockNumberField(props: StockNumberFieldProps) {
  return (
    <Label className={STOCK_FIELD_LABEL_CLASS}>
      {props.label}
      <StockNumberInput {...props} />
      <StockFieldError error={props.error} id={props.errorId} />
    </Label>
  )
}

type SingleStockFieldsProps = Pick<
  ProductStockControlCardProps,
  | 'allowNegativeStock'
  | 'fieldErrors'
  | 'initialStock'
  | 'idealStock'
  | 'onIdealStockChange'
  | 'onInitialStockChange'
  | 'register'
>

const SingleStockFields = (props: SingleStockFieldsProps) => (
  <div className={STOCK_FIELDS_GRID_CLASS}>
    {SINGLE_STOCK_FIELD_DEFINITIONS.map(([name, label, errorId, onChangeKey]) => (
      <StockNumberField
        error={props.fieldErrors[name]}
        errorId={errorId}
        key={name}
        label={label}
        min={name !== 'initialStock' || !props.allowNegativeStock ? '0' : undefined}
        name={name}
        onChange={props[onChangeKey]}
        register={props.register}
        value={props[name]}
      />
    ))}
  </div>
)

function CalculatedStockField({ value }: { value: number }) {
  return (
    <Label className={STOCK_FIELD_LABEL_CLASS}>
      Estoque inicial
      <Input className={STOCK_INPUT_CLASS} readOnly value={value} />
      <span className={STOCK_FIELD_HINT_CLASS}>
        Total calculado pelas quantidades iniciais das marcas.
      </span>
    </Label>
  )
}

type BrandControlsProps = Pick<
  ProductStockControlCardProps,
  | 'allowNegativeStock'
  | 'brandErrors'
  | 'brands'
  | 'fieldErrors'
  | 'onAddBrand'
  | 'onBrandChange'
  | 'onPrimaryBrandChange'
  | 'onRemoveBrand'
>

function BrandControls(props: BrandControlsProps) {
  return (
    <div className={BRAND_CONTROLS_CLASS}>
      <BrandEditorList {...props} />
      <StockFieldError {...BRAND_FIELD_ERROR_PROPS} error={props.fieldErrors.brands} />
      <Button {...ADD_BRAND_BUTTON_PROPS} onClick={props.onAddBrand}>
        <Icon name='plus' className={ADD_BRAND_ICON_CLASS} /> Adicionar outra marca
      </Button>
    </div>
  )
}

type BrandEditorListProps = Pick<
  ProductStockControlCardProps,
  | 'allowNegativeStock'
  | 'brandErrors'
  | 'brands'
  | 'onBrandChange'
  | 'onPrimaryBrandChange'
  | 'onRemoveBrand'
>

function BrandEditorList(props: BrandEditorListProps) {
  return props.brands.map((brand, index) => (
    <ProductBrandEditor
      allowNegativeStock={props.allowNegativeStock}
      brand={brand}
      canRemove={props.brands.length > 1}
      errors={props.brandErrors?.[index]}
      index={index}
      key={brand.id}
      onChange={(changes) => props.onBrandChange(brand.id, changes)}
      onPrimaryChange={() => props.onPrimaryBrandChange(brand.id)}
      onRemove={() => props.onRemoveBrand(brand.id)}
    />
  ))
}
