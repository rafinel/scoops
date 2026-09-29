import type {
  ProductRecipeDetails,
  RecipeIngredientDetails,
} from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'

import { RecipeNotConfigured, RecipeSummary } from './recipe-summary'
import { RecipeYieldEditor } from './recipe-yield-editor'
import { useProductRecipeCard } from './use-product-recipe-card'

export type ProductRecipeCardProps = {
  canManage?: boolean
  details: ProductRecipeDetails
  onAdd: () => void
  onEdit: (ingredient: RecipeIngredientDetails) => void
  onProduce: () => void
  onRemove: (ingredient: RecipeIngredientDetails) => void
}

export const ProductRecipeCard = ({
  canManage = true,
  details,
  onAdd,
  onEdit,
  onProduce,
  onRemove,
}: ProductRecipeCardProps) => {
  const { product, recipe } = details
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()
  const { error, handleSaveYield, isPending, setYieldQuantity, yieldQuantity } =
    useProductRecipeCard(product.id, recipe)
  const hasIngredients = Boolean(recipe?.ingredients.length)
  const limitingIngredient = recipe?.ingredients.find((item) => item.isLimiting)

  return (
    <section className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-lg font-extrabold'>Receita</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Defina os ingredientes que compõem uma produção.
          </p>
        </div>
        {canManage ? (
          <Button
            disabled={!hasIngredients}
            onClick={onProduce}
            variant={hasIngredients ? 'default' : 'outline'}
          >
            <Icon name='play' /> Produzir
          </Button>
        ) : null}
      </div>
      {canManage ? (
        <RecipeYieldEditor
          error={error ?? undefined}
          isPending={isPending}
          onSave={() => void handleSaveYield()}
          onValueChange={setYieldQuantity}
          unit={product.unit}
          value={yieldQuantity}
        />
      ) : recipe ? (
        <p className='mt-5 text-sm text-muted-foreground'>
          Rendimento estimado: {formatQuantity(recipe.yieldQuantity, product.unit)}
        </p>
      ) : null}
      {recipe ? (
        <RecipeSummary
          limitingIngredientName={limitingIngredient?.ingredientProductName}
          maximumProducible={formatQuantity(
            recipe.maximumProducibleQuantity,
            product.unit,
          )}
          totalCost={formatCurrency(recipe.totalCost)}
          totalCostDetail={`por ${formatQuantity(recipe.yieldQuantity, product.unit)}`}
          unitCost={formatCurrency(recipe.unitCost)}
          unitCostDetail={`por ${product.unit}`}
          canManage={canManage}
          ingredients={recipe.ingredients}
          onAdd={onAdd}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ) : (
        <RecipeNotConfigured canManage={canManage} onAdd={onAdd} />
      )}
    </section>
  )
}
