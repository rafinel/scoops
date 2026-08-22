import { createFileRoute, Outlet } from '@tanstack/react-router'

import { requireManagerMiddleware } from '@/middlewares/require-manager-middleware'

export const Route = createFileRoute('/_authenticated/products/$productId')({
  beforeLoad: requireManagerMiddleware,
  component: ProductDetailsRoute,
})

function ProductDetailsRoute() {
  return <Outlet />
}
