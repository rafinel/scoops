import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/products/$productId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/products/$productId/stock',
      params: { productId: params.productId },
    })
  },
})
