import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/products/$productId')({
  component: ProductDetailsRoute,
})

function ProductDetailsRoute() {
  return <Outlet />
}
