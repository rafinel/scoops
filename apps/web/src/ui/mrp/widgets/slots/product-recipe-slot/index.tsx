import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'
import { ProductRecipeCard } from './product-recipe-card'
import { ProduceProductDialog } from './produce-product-dialog'
import { RecipeIngredientDialog } from './recipe-ingredient-dialog'
import { RemoveRecipeIngredientDialog } from './remove-recipe-ingredient-dialog'
import { useProductRecipeSlot } from './use-product-recipe-slot'

export type ProductRecipeSlotProps = { productId: string }
export const ProductRecipeSlot = ({ productId }: ProductRecipeSlotProps) => {
  const slot = useProductRecipeSlot(productId)
  return (
    <ProductDetailsPage
      onBack={slot.handleBack}
      product={slot.product}
      selectedTab='recipe'
    >
      {slot.isLoading && !slot.isUnsupported ? <RecipeLoading /> : null}
      {slot.isError && !slot.isUnsupported ? (
        <RecipeError onRetry={slot.handleRetry} />
      ) : null}
      {slot.details && !slot.isLoading && !slot.isError && !slot.isUnsupported ? (
        <>
          <ProductRecipeCard
            details={slot.details}
            onAdd={() => slot.setSelectedAction({ kind: 'add' })}
            onEdit={(ingredient) => slot.setSelectedAction({ kind: 'edit', ingredient })}
            onProduce={() => slot.setSelectedAction({ kind: 'produce' })}
            onRemove={(ingredient) =>
              slot.setSelectedAction({ kind: 'remove', ingredient })
            }
          />
          {slot.selectedAction?.kind === 'add' || slot.selectedAction?.kind === 'edit' ? (
            <RecipeIngredientDialog
              existingProductIds={
                slot.details.recipe?.ingredients.map(
                  (ingredient) => ingredient.ingredientProductId,
                ) ?? []
              }
              ingredient={
                slot.selectedAction.kind === 'edit'
                  ? slot.selectedAction.ingredient
                  : undefined
              }
              onOpenChange={slot.handleActionOpenChange}
              onSuccess={slot.handleActionSuccess}
              open
              productId={productId}
              recipeTotalCost={slot.details.recipe?.totalCost ?? 0}
              unit={slot.details.product.unit}
            />
          ) : null}
          {slot.selectedAction?.kind === 'remove' ? (
            <RemoveRecipeIngredientDialog
              ingredient={slot.selectedAction.ingredient}
              onOpenChange={slot.handleActionOpenChange}
              onSuccess={slot.handleActionSuccess}
              open
              productId={productId}
            />
          ) : null}
          {slot.selectedAction?.kind === 'produce' && slot.details.recipe ? (
            <ProduceProductDialog
              onOpenChange={slot.handleActionOpenChange}
              onSuccess={slot.handleActionSuccess}
              open
              product={slot.details.product}
              recipe={slot.details.recipe}
            />
          ) : null}
        </>
      ) : null}
    </ProductDetailsPage>
  )
}
function RecipeLoading() {
  return (
    <div
      aria-busy='true'
      aria-label='Carregando receita'
      className='space-y-4'
      role='status'
    >
      <div className='h-36 animate-pulse rounded-2xl bg-muted' />
      <div className='h-96 animate-pulse rounded-2xl bg-muted' />
    </div>
  )
}
function RecipeError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className='rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center'
      role='alert'
    >
      <Icon className='mx-auto size-7 text-destructive' name='triangle-alert' />
      <h1 className='mt-3 text-lg font-extrabold'>Não foi possível carregar a receita</h1>
      <p className='mt-1 text-sm text-muted-foreground'>
        O estoque do produto continua disponível.
      </p>
      <Button className='mt-4' onClick={onRetry} variant='outline'>
        Tentar novamente
      </Button>
    </div>
  )
}
