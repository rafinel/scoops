import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'
import { UserProfile } from '@scoops/core/identity/domain/structures'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'
import { ProductRecipeCard } from './product-recipe-card'
import { RecipeActionDialogs } from './action-dialogs'
import { RecipeError } from './recipe-error'
import { RecipeLoading } from './recipe-loading'
import { useProductRecipeSlot } from './use-product-recipe-slot'

export type ProductRecipeSlotProps = { productId: string }
export const ProductRecipeSlot = ({ productId }: ProductRecipeSlotProps) => {
  const { account } = useAuthContext()
  const canManage = account?.profile === UserProfile.Manager
  const {
    details,
    handleActionOpenChange,
    handleActionSuccess,
    handleAddAction,
    handleBack,
    handleEditAction,
    handleProduceAction,
    handleRemoveAction,
    handleRetry,
    isError,
    isLoading,
    isRefreshing,
    isUnsupported,
    product,
    selectedAction,
  } = useProductRecipeSlot(productId)
  return (
    <ProductDetailsPage onBack={handleBack} product={product} selectedTab='recipe'>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
      {isLoading && !isUnsupported ? <RecipeLoading /> : null}
      {isError && !isUnsupported ? <RecipeError onRetry={handleRetry} /> : null}
      {details && !isLoading && !isError && !isUnsupported ? (
        <>
          <ProductRecipeCard
            canManage={canManage}
            details={details}
            onAdd={handleAddAction}
            onEdit={handleEditAction}
            onProduce={handleProduceAction}
            onRemove={handleRemoveAction}
          />
          {canManage ? (
            <RecipeActionDialogs
              details={details}
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              productId={productId}
              selectedAction={selectedAction}
            />
          ) : null}
        </>
      ) : null}
    </ProductDetailsPage>
  )
}
