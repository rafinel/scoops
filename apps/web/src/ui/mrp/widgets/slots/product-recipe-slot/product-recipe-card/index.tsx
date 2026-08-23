import type {
  ProductRecipeDetails,
  RecipeIngredientDetails,
} from '@scoops/core/mrp/domain/structures'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { RecipeEmptyState } from '../recipe-empty-state'
import { RecipeIngredientsTable } from '../recipe-ingredients-table'
import { useProductRecipeCard } from './use-product-recipe-card'

export type ProductRecipeCardProps = {
  details: ProductRecipeDetails
  onAdd: () => void
  onEdit: (ingredient: RecipeIngredientDetails) => void
  onProduce: () => void
  onRemove: (ingredient: RecipeIngredientDetails) => void
}
export const ProductRecipeCard = ({
  details,
  onAdd,
  onEdit,
  onProduce,
  onRemove,
}: ProductRecipeCardProps) => {
  const { product, recipe } = details
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  const card = useProductRecipeCard(product.id, recipe)
  const hasIngredients = Boolean(recipe?.ingredients.length)
  return (
    <section className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-lg font-extrabold'>Receita</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Defina os ingredientes que compõem uma produção.
          </p>
        </div>
        <Button
          disabled={!hasIngredients}
          onClick={onProduce}
          variant={hasIngredients ? 'default' : 'outline'}
        >
          <Icon name='play' /> Produzir
        </Button>
      </div>
      <div className='mt-5 flex max-w-xl flex-col gap-2 rounded-xl bg-muted p-2 focus-within:ring-2 focus-within:ring-ring/20 sm:flex-row sm:items-center sm:gap-0 sm:overflow-hidden sm:p-1'>
        <label
          className='grid min-w-0 flex-1 gap-2 px-3 text-sm font-semibold text-muted-foreground sm:grid-cols-[auto_1fr] sm:items-center sm:gap-3 sm:whitespace-nowrap'
          htmlFor='recipe-yield-quantity'
        >
          Rendimento estimado por:
          <Input
            aria-describedby={card.error ? 'recipe-yield-error' : undefined}
            aria-invalid={Boolean(card.error)}
            className='h-9 min-w-0 bg-card'
            id='recipe-yield-quantity'
            inputMode='decimal'
            min='0'
            onChange={(event) => card.setYieldQuantity(event.target.value)}
            type='number'
            value={card.yieldQuantity}
          />
        </label>
        <span className='grid place-items-center rounded-lg bg-card px-3 py-2 text-sm font-bold sm:rounded-none sm:border-l sm:bg-transparent sm:py-0'>
          {product.unit}
        </span>
        <Button
          className='w-full sm:ml-1 sm:w-auto'
          disabled={card.isPending}
          onClick={() => void card.handleSaveYield()}
          size='sm'
          type='button'
          variant='outline'
        >
          {card.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
      {card.error ? (
        <p
          className='mt-2 text-sm font-semibold text-destructive'
          id='recipe-yield-error'
          role='alert'
        >
          {card.error}
        </p>
      ) : null}
      {recipe ? (
        <>
          <div className='mt-5 grid gap-3 md:grid-cols-3'>
            <Metric
              label='CMV total'
              value={formatCurrency(recipe.totalCost)}
              detail={`por ${formatQuantity(recipe.yieldQuantity, product.unit)}`}
            />
            <Metric
              label='Custo unitário'
              value={formatCurrency(recipe.unitCost)}
              detail={`por ${product.unit}`}
            />
            <Metric
              attention
              label='Máximo produzível'
              value={formatQuantity(recipe.maximumProducibleQuantity, product.unit)}
              detail={
                recipe.ingredients.find((ingredient) => ingredient.isLimiting)
                  ?.ingredientProductName
                  ? `limitado por ${recipe.ingredients.find((ingredient) => ingredient.isLimiting)?.ingredientProductName}`
                  : 'Sem ingredientes'
              }
            />
          </div>
          {hasIngredients ? (
            <>
              <div className='mt-5'>
                <RecipeIngredientsTable
                  ingredients={recipe.ingredients}
                  onEdit={onEdit}
                  onRemove={onRemove}
                />
              </div>
              <Button className='mt-5' onClick={onAdd}>
                <Icon name='plus' /> Adicionar ingrediente
              </Button>
            </>
          ) : (
            <div className='mt-5'>
              <RecipeEmptyState canAdd onAdd={onAdd} />
            </div>
          )}
        </>
      ) : (
        <div className='mt-5'>
          <RecipeEmptyState canAdd={false} onAdd={onAdd} />
        </div>
      )}
    </section>
  )
}

function Metric({
  attention,
  detail,
  label,
  value,
}: {
  attention?: boolean
  detail: string
  label: string
  value: string
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${attention ? 'bg-warning-soft text-warning' : 'bg-muted'}`}
    >
      <p className='text-xs font-bold tracking-wide uppercase'>{label}</p>
      <p className='mt-2 text-xl font-extrabold'>{value}</p>
      <p className='mt-1 text-xs'>{detail}</p>
    </div>
  )
}
