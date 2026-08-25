import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import { productSettingsSearchSchema } from '@scoops/validation'

import { ProductSettingsSlot } from '@/ui/mrp/widgets/slots/product-settings-slot'

export const Route = createFileRoute('/_authenticated/products/$productId/settings')({
  validateSearch: productSettingsSearchSchema,
  component: ProductSettingsRoute,
})

function ProductSettingsRoute() {
  const { productId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const hasCompleteRetryIntent = Boolean(
    search.retryCategory && search.retryDependency && search.retryProductId,
  )
  const hasMismatchedRetryProduct =
    search.retryProductId !== undefined && search.retryProductId !== productId

  useEffect(() => {
    if (
      (!hasCompleteRetryIntent &&
        (search.retryCategory !== undefined ||
          search.retryDependency !== undefined ||
          search.retryProductId !== undefined)) ||
      hasMismatchedRetryProduct
    ) {
      void navigate({
        replace: true,
        search: {
          retryCategory: undefined,
          retryDependency: undefined,
          retryProductId: undefined,
        },
      })
    }
  }, [
    hasCompleteRetryIntent,
    hasMismatchedRetryProduct,
    navigate,
    search.retryCategory,
    search.retryDependency,
    search.retryProductId,
  ])

  return <ProductSettingsSlot productId={productId} retrySearch={search} />
}
